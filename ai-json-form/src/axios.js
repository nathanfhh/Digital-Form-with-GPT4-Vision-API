import axios from "axios";


const Request = axios.create({
  baseURL: `${import.meta.env.VITE_APP_BASE_URL}/api`,
});

export const getVersion = () => Request.get("/version");
