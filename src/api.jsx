const API_URL = "http://localhost:5001"; // Change this when deploying

const api = {
  getUsers: async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching users:", error);
      return null;
    }
  },

  addUser: async (name, email) => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      return await response.json();
    } catch (error) {
      console.error("Error adding user:", error);
      return null;
    }
  },
};

export default api;