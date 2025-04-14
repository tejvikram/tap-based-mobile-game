import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiMapPin, FiDroplet, FiWind, FiSunrise, FiSunset, FiThermometer } from 'react-icons/fi';
import { WiDaySunny, WiRain, WiCloudy, WiSnow, WiDayThunderstorm, WiDust, WiBarometer } from 'react-icons/wi';
import axios from 'axios';

interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  sunrise: number;
  sunset: number;
  icon: string;
  precipitation: number;
  forecast: ForecastData[];
}

interface ForecastData {
  date: string;
  temp: number;
  condition: string;
}

interface WeatherResponse {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
  };
  sys: {
    sunrise: number;
    sunset: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
}

interface UnsplashResponse {
  results: Array<{
    urls: {
      regular: string;
    };
  }>;
}

interface ForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
    };
    weather: Array<{
      main: string;
    }>;
  }>;
}

const API_KEY = '088885a41f5c912c191c4d80edbc9593';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const UNSPLASH_API_KEY = 'YOUR_UNSPLASH_API_KEY'; // You'll need to sign up for Unsplash API

const App = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [backgroundImage, setBackgroundImage] = useState('');

  const convertTemp = (temp: number, to: 'C' | 'F'): number => {
    if (to === 'F') {
      return Math.round((temp * 9/5) + 32);
    }
    return Math.round(temp);
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const fetchLocationImage = async (location: string) => {
    try {
      const response = await axios.get<UnsplashResponse>(`https://api.unsplash.com/search/photos`, {
        params: {
          query: `${location} landmark`,
          client_id: UNSPLASH_API_KEY,
          orientation: 'landscape'
        }
      });
      if (response.data.results.length > 0) {
        setBackgroundImage(response.data.results[0].urls.regular);
      }
    } catch (error) {
      console.error('Error fetching location image:', error);
    }
  };

  const fetchWeatherData = async (location: string) => {
    setLoading(true);
    setError(null);
    try {
      const [weatherResponse, forecastResponse] = await Promise.all([
        axios.get<WeatherResponse>(`${BASE_URL}/weather`, {
          params: {
            q: location,
            appid: API_KEY,
            units: 'metric'
          }
        }),
        axios.get<ForecastResponse>(`${BASE_URL}/forecast`, {
          params: {
            q: location,
            appid: API_KEY,
            units: 'metric'
          }
        })
      ]);

      const weatherData = weatherResponse.data;
      const forecastData = forecastResponse.data;

      // Fetch location image
      await fetchLocationImage(location);

      setWeatherData({
        location: weatherData.name,
        temperature: Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        condition: weatherData.weather[0].main,
        description: weatherData.weather[0].description,
        humidity: weatherData.main.humidity,
        windSpeed: Math.round(weatherData.wind.speed * 3.6),
        pressure: weatherData.main.pressure,
        sunrise: weatherData.sys.sunrise,
        sunset: weatherData.sys.sunset,
        icon: weatherData.weather[0].main.toLowerCase(),
        precipitation: weatherData.rain?.['1h'] || 0,
        forecast: forecastData.list
          .filter((_: any, index: number) => index % 8 === 0)
          .slice(0, 5)
          .map((item: any) => ({
            date: new Date(item.dt * 1000).toLocaleDateString(undefined, { weekday: 'short' }),
            temp: Math.round(item.main.temp),
            condition: item.weather[0].main
          }))
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError('Could not fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <WiDaySunny className="text-6xl text-yellow-400" />;
      case 'rain':
        return <WiRain className="text-6xl text-blue-400" />;
      case 'clouds':
        return <WiCloudy className="text-6xl text-gray-400" />;
      case 'snow':
        return <WiSnow className="text-6xl text-blue-200" />;
      case 'thunderstorm':
        return <WiDayThunderstorm className="text-6xl text-purple-400" />;
      case 'dust':
      case 'sand':
      case 'haze':
        return <WiDust className="text-6xl text-yellow-600" />;
      default:
        return <WiDaySunny className="text-6xl text-yellow-400" />;
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeatherData(searchQuery);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-primary-500/90 to-primary-700/90 animate-gradient relative"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl font-bold text-black text-center mb-8">
            🌤️ Weather Dashboard 🌤️
          </h1>

          <div className="flex justify-end mb-4">
            <button
              onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
              className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              Switch to °{unit === 'C' ? 'F' : 'C'}
            </button>
          </div>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex items-center bg-white rounded-lg shadow-lg p-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a city..."
                className="flex-1 px-4 py-2 focus:outline-none text-gray-700 placeholder-gray-400"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2"
              >
                <FiSearch className="text-xl" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>

          {error && (
            <div className="text-center text-red-200 mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
              <p className="mt-4">Loading weather data...</p>
            </div>
          ) : weatherData ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6 mt-6"
            >
              {/* Current Weather Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Current Weather in {weatherData.location}</h2>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="text-7xl mr-4">
                      {getWeatherIcon(weatherData.condition)}
                    </div>
                    <div>
                      <p className="text-5xl font-bold text-gray-800">
                        {convertTemp(weatherData.temperature, unit)}°{unit}
                      </p>
                      <p className="text-lg text-gray-600 capitalize">
                        {weatherData.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-primary-50/80 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FiDroplet className="text-blue-500 text-xl mr-2" />
                      <h4 className="text-gray-700 font-medium">Humidity</h4>
                    </div>
                    <p className="text-2xl font-bold text-primary-600">{weatherData.humidity}%</p>
                  </div>

                  <div className="bg-primary-50/80 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FiWind className="text-blue-500 text-xl mr-2" />
                      <h4 className="text-gray-700 font-medium">Wind</h4>
                    </div>
                    <p className="text-2xl font-bold text-primary-600">{weatherData.windSpeed} km/h</p>
                  </div>

                  <div className="bg-primary-50/80 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <WiBarometer className="text-blue-500 text-xl mr-2" />
                      <h4 className="text-gray-700 font-medium">Pressure</h4>
                    </div>
                    <p className="text-2xl font-bold text-primary-600">{weatherData.pressure} hPa</p>
                  </div>

                  <div className="bg-primary-50/80 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <WiRain className="text-blue-500 text-xl mr-2" />
                      <h4 className="text-gray-700 font-medium">Precipitation</h4>
                    </div>
                    <p className="text-2xl font-bold text-primary-600">{weatherData.precipitation} mm</p>
                  </div>
                </div>
              </div>

              {/* Sunrise & Sunset Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">🌅Sunrise & Sunset🌇</h3>
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <FiSunrise className="text-yellow-500 text-xl mr-2" />
                      <span>{formatTime(weatherData.sunrise)}</span>
                    </div>
                    <div className="flex items-center">
                      <FiSunset className="text-orange-500 text-xl mr-2" />
                      <span>{formatTime(weatherData.sunset)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Feels Like</h3>
                  <div className="flex items-center">
                    <FiThermometer className="text-red-500 text-xl mr-2" />
                    <span>{convertTemp(weatherData.feelsLike, unit)}°{unit}</span>
                  </div>
                </div>
              </div>

              {/* Forecast Section */}
              <h3 className="text-xl font-semibold text-gray-700 mb-4">5-Day Forecast</h3>
              <div className="grid grid-cols-5 gap-4">
                {weatherData.forecast.map((day, index) => (
                  <div key={index} className="bg-primary-50/80 rounded-lg p-3 text-center">
                    <p className="font-medium text-gray-700">{day.date}</p>
                    <div className="text-3xl my-2">
                      {getWeatherIcon(day.condition)}
                    </div>
                    <p className="font-bold text-primary-600">
                      {convertTemp(day.temp, unit)}°{unit}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="text-center text-white text-lg">
              <p className="mb-2">👋 Welcome to Weather Dashboard!</p>
              <p>Enter a city name above to get the current weather information.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default App;
