import axios from "axios";

export const API_data = async () => {
    try {
      const response = await axios.get('https://api.coffeeraffa.az/api/coffee/');
      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
};

export const API_categories = async () => {
  try {
    const response = await axios.get("https://api.coffeeraffa.az/api/categories/");
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

