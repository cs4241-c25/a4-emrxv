require("dotenv").config();
//console.log("MONGODB_URI:", process.env.MONGO_URI);
const MONGO_URI = process.env.MONGODB_URI;
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const cors = require("cors");

app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002"
        ];

        if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".glitch.me")) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));
// Middleware
app.use(express.static(path.join(__dirname, "build")));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(session({
    secret: process.env.SESSION_SECRET || "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(morgan('dev')); // HTTP requests


let db, usersCollection;

MongoClient.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true }).then(client => {
    console.log("Connected to MongoDB");
    db = client.db("workoutTracker");
    usersCollection = db.collection("users");
}).catch(err => console.error("MongoDB connection error:", err));


passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://a4-emre-sunar.glitch.me/auth/github/callback" 
  },
  async (accessToken, refreshToken, profile, done) => {
      try {
          let user = await usersCollection.findOne({ githubId: profile.id });

          if (!user) {
              user = {
                  githubId: profile.id,
                  username: profile.username,
                  displayName: profile.displayName,
                  avatar: profile.photos[0].value,
                  data: [] 
              };
              await usersCollection.insertOne(user);
          }

          return done(null, user);
      } catch (error) {
          return done(error);
      }
  }
));


passport.serializeUser((user, done) => done(null, user.githubId));
passport.deserializeUser(async (githubId, done) => {
    const user = await usersCollection.findOne({ githubId });
    done(null, user);
});


app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

app.get("/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/" }),
    (req, res) => {
        res.redirect("https://a4-emre-sunar.glitch.me/dashboard");
    }
);

app.get("/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: "Not Authenticated" });
    }
});


app.get("/auth/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
            return next(err);
        }
        req.session.destroy(() => {
            res.clearCookie("connect.sid", { path: "/" });
            res.json({ message: "Logged out successfully" });
        });
    });
});

app.get("/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true, user: req.user });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

/*
app.post("/login", passport.authenticate("local"), (req, res) => {res.json(req.user); });
app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            console.error("Logout error:", err);
            return next(err);
        }

        req.session.destroy(() => {
            res.clearCookie("connect.sid"); // Clear session cookie
            res.json({ message: "Logged out successfully" });
        });
    });
});
*/

app.get("/results", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not Authenticated" });

    const user = await usersCollection.findOne({ githubId: req.user.githubId });
    res.json({ username: user.username, data: user.data || [] });
});

app.post("/data", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not Authenticated" });

    const { exercise, duration, intensity } = req.body;
    const workout = {
        _id: new ObjectId(),
        exercise,
        duration,
        intensity,
        calories: calculateCalories(duration, intensity),
    };

    await usersCollection.updateOne({ githubId: req.user.githubId }, { $push: { data: workout } });
    res.json({ message: "Workout updated successfully", workout });
});

app.put("/data/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        console.log("Incoming update request:", req.body); // Debugging

        const { exercise, duration, intensity } = req.body;
        if (!exercise || !duration || !intensity) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const workoutId = new ObjectId(req.params.id);

        // Ensure the workout exists before updating
        const existingWorkout = await usersCollection.findOne(
            { githubId: req.user.githubId, "data._id": workoutId }
        );

        if (!existingWorkout) {
            return res.status(404).json({ message: "Workout not found" });
        }

        // Perform the update
        const result = await usersCollection.updateOne(
            { githubId: req.user.githubId, "data._id": workoutId },
            {
                $set: {
                    "data.$.exercise": exercise,
                    "data.$.duration": parseInt(duration, 10),
                    "data.$.intensity": intensity,
                    "data.$.calories": calculateCalories(parseInt(duration, 10), intensity),
                },
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "Workout not updated" });
        }

        res.json({ message: "Workout updated successfully" });
    } catch (error) {
        console.error("Error updating workout:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


app.delete("/data/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not Authenticated" });

    const workoutId = new ObjectId(req.params.id);
    const result = await usersCollection.updateOne(
        { githubId: req.user.githubId },
        { $pull: { data: { _id: workoutId } } });

    res.json({ message: "Workout deleted successfully" });
});

function calculateCalories (duration, intensity) {
    const intensityFactors = { low: 5, medium: 8, high: 12 };
    return duration * (intensityFactors[intensity] || 5);
}

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => console.log(`Listening on port ${port}`));