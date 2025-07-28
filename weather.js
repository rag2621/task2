//import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Geocoding function using Nominatim (free)
async function getCityCoordinates(city) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherApp/1.0'
      }
    });
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
    throw new Error('City not found');
  } catch (error) {
    throw new Error(`Geocoding failed: ${error.message}`);
  }
}

export const Weather = {
  name: 'weather-forecast',
  schema: {
    City: { type: 'string', description: "Name of the city" },
  },
  handler: async ({ City }) => {
    try {
      // Step 1: Get coordinates for the city
      const coords = await getCityCoordinates(City);
      
      // Step 2: Get weather data using coordinates
      const API_KEY = '8287f0c9b19218ee265784115d43bdde'; // Replace with your actual API key
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEY}&units=metric`;
      
      const response = await fetch(weatherUrl);
      const data = await response.json();
      
      if (response.ok) {
        // Format weather information
        const weatherInfo = `
🌤️ Weather in ${data.name}, ${data.sys.country}
🌡️ Temperature: ${data.main.temp}°C (feels like ${data.main.feels_like}°C)
📊 Condition: ${data.weather[0].main} - ${data.weather[0].description}
💧 Humidity: ${data.main.humidity}%
🌪️ Wind Speed: ${data.wind.speed} m/s
👁️ Visibility: ${data.visibility / 1000} km
☁️ Cloudiness: ${data.clouds.all}%
📍 Coordinates: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}
        `.trim();
        
        return {
          content: [
            {
              type: 'text',
              text: weatherInfo,
            },
          ],
        };
      } else {
        throw new Error(`Weather API error: ${data.message}`);
      }
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error fetching weather for ${City}: ${error.message}`,
          },
        ],
      };
    }
  },
};