// mongodbService.js
// MongoDB integration for storing winner data

const MONGODB_API_URL = "https://cc-contexto-d01a6bbfa039.herokuapp.com/contexto-winner";
const DEBUG_MODE = false; // Set to true for development debugging

async function sendWinnerToMongoDB(winnerData) {
    try {
        if (DEBUG_MODE) console.log("Sending winner data:", winnerData);
        
        const response = await fetch(MONGODB_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(winnerData)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        if (DEBUG_MODE) console.log("Winner data saved:", result);
        return result;
    } catch (error) {
        if (DEBUG_MODE) console.error("Failed to send winner data:", error);
        throw error;
    }
}

window.MongoDBService = {
    sendWinnerToMongoDB
};
