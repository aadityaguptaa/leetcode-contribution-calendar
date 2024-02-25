const axios = require("axios");

async function getGitHubContributions(username) {
  try {
    const apiUrl = `https://leetcode-stats-api.herokuapp.com/${username}`;

    const response = await axios.get(apiUrl);

    // Assuming the API returns JSON data
    const jsonData = response.data;
    console.log(jsonData)
    const convertedCalendar = {};
    for (const timestamp in jsonData.submissionCalendar) {
      const date = new Date(timestamp * 1000);
      const formattedDate = date.toISOString().slice(0, 10); // Get YYYY-MM-DD
      convertedCalendar[formattedDate] = jsonData.submissionCalendar[timestamp];
    }
    return convertedCalendar;

  } catch (error) {
    console.error("Error fetching data from API:", error.message);
    throw new Error("Failed to fetch GitHub contributions from API");
  }
}

module.exports = { getGitHubContributions };
