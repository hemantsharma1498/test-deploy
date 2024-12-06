interface ImportMetaEnv {
 VITE_API_HOST: string;
 VITE_API_PORT: string;
}

export const config = {
 apiUrl: `http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}`
};
