const axios = require("axios");

async function getLeetcodeContributions(username) {
  try {
    const apiUrl = `https://leetcode-stats-api.herokuapp.com/${username}`;
    const response = await axios.get(apiUrl);
    
    const jsonData = response.data;
    const convertedCalendar = convertSubmissionCalendar(jsonData.submissionCalendar);
    
    return convertedCalendar;

  } catch (error) {
    console.error("Error fetching data from API:", error.message);
    throw new Error("Failed to fetch Leetcode contributions from API");
  }
}

function convertSubmissionCalendar(submissionCalendar) {
  const convertedCalendar = {};

  for (const timestamp in submissionCalendar) {
    const date = new Date(timestamp * 1000);
    const formattedDate = date.toISOString().slice(0, 10);
    convertedCalendar[formattedDate] = submissionCalendar[timestamp];
  }

  return convertedCalendar;
}

module.exports = { getLeetcodeContributions };
