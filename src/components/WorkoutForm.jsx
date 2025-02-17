import { useState } from "react";

const WorkoutForm = ({ fetchWorkouts }) => {
    const [exercise, setExercise] = useState("");
    const [duration, setDuration] = useState("");
    const [intensity, setIntensity] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!exercise || !duration || !intensity) return;

        await fetch("https://a4-emre-sunar.glitch.me/data", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ exercise, duration: parseInt(duration, 10), intensity }),
        });

        fetchWorkouts();
        setExercise("");
        setDuration("");
        setIntensity("");
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 bg-white p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-2">Add Workout</h2>
            <input
                type="text"
                placeholder="Exercise Name"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                className="w-full border p-2 mb-2"
            />
            <input
                type="number"
                placeholder="Duration (min)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border p-2 mb-2"
            />
            <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                className="w-full border p-2 mb-2"
            >
                <option value="" disabled>Select intensity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>
            <button type="submit" className="w-full bg-green-700 text-white p-2">
                Log Workout
            </button>
        </form>
    );
};

export default WorkoutForm;
