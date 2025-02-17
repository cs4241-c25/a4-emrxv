import { useEffect, useState } from "react";

const WorkoutLog = ({ workouts, fetchWorkouts }) => {

    const [editingWorkout, setEditingWorkout] = useState({});

    const handleChange = (e, id) => {
        setEditingWorkout((prev) => ({
            ...prev,
            [id]: { ...prev[id], [e.target.name]: e.target.value },
        }));
    };

    const updateWorkout = async (id) => {
        const updatedWorkout = {
            exercise: editingWorkout[id]?.exercise || workouts.find(w => w._id === id)?.exercise,
            duration: editingWorkout[id]?.duration || workouts.find(w => w._id === id)?.duration,
            intensity: editingWorkout[id]?.intensity || workouts.find(w => w._id === id)?.intensity,
        };

        console.log("Updating workout:", updatedWorkout);

        if (!updatedWorkout.exercise || !updatedWorkout.duration || !updatedWorkout.intensity) {
            console.error("Missing required fields for update.");
            return;
        }

        const response = await fetch(`https://a4-emre-sunar.glitch.me/data/${id}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedWorkout),
        });

        if (response.ok) {
            fetchWorkouts(); // Refresh the list
            setEditingWorkout((prev) => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        } else {
            console.error("Error updating workout");
        }
    };


    const deleteWorkout = async (id) => {
        const response = await fetch(`https://a4-emre-sunar.glitch.me/data/${id}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (response.ok) fetchWorkouts();
        else console.error("Error deleting workout");
    };

    return (
        <div className="mt-6 bg-white p-4 rounded shadow">
            <h2 className="text-lg font-bold">Workout Log</h2>
            <table className="w-full border mt-2">
                <thead className="bg-gray-200">
                <tr>
                    <th className="border p-2">Exercise</th>
                    <th className="border p-2">Duration</th>
                    <th className="border p-2">Intensity</th>
                    <th className="border p-2">Calories</th>
                    <th className="border p-2">Actions</th>
                </tr>
                </thead>
                <tbody>
                {workouts.map((workout) => (
                    <tr key={workout._id}>
                        <td className="border p-2">
                            <input
                                type="text"
                                name="exercise"
                                value={editingWorkout[workout._id]?.exercise || workout.exercise}
                                onChange={(e) => handleChange(e, workout._id)}
                                className="w-full border p-2"
                            />
                        </td>
                        <td className="border p-2">
                            <input
                                type="number"
                                name="duration"
                                value={editingWorkout[workout._id]?.duration || workout.duration}
                                onChange={(e) => handleChange(e, workout._id)}
                                className="w-full border p-2"
                            />
                        </td>
                        <td className="border p-2">
                            <select
                                name="intensity"
                                value={editingWorkout[workout._id]?.intensity || workout.intensity}
                                onChange={(e) => handleChange(e, workout._id)}
                                className="w-full border p-2"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </td>
                        <td className="border p-2">
                            {workout.calories || "N/A"}
                        </td>
                        <td className="border p-2 flex">
                            <button
                                onClick={() => updateWorkout(workout._id)}
                                className="bg-yellow-700 text-white p-2 rounded mr-2"
                            >
                                Update
                            </button>
                            <button
                                onClick={() => deleteWorkout(workout._id)}
                                className="bg-red-700 text-white p-2 rounded"
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default WorkoutLog;
