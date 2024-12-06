import { useState, useEffect } from 'react';
import { config } from './env';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

function App() {
    const [count, setCount] = useState(0);
    const [activeUsers, setActiveUsers] = useState(0);

    useEffect(() => {
        const getCount = async () => {
            const response = await fetch(`${config.apiUrl}/api/count`);
            const data = await response.json();
            setCount(data.final_count);
            setActiveUsers(data.active_users);
        };
        getCount();

        // Delay WebSocket connection
        const wsTimeout = setTimeout(() => {
            const connect = () => {
                const ws = new WebSocket(`ws://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/ws`);

                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    setCount(data.final_count);
                    setActiveUsers(data.active_users);
                };

                ws.onclose = () => {
                    console.log('WebSocket disconnected. Attempting reconnection...');
                    setTimeout(connect, 1000);
                };

                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };

                return ws;
            };

            const ws = connect();
            return () => ws.close();
        }, 1000);

        return () => clearTimeout(wsTimeout);
    }, []);

    const updateCount = async (action: 1 | -1) => {
        try {
            await fetch(`${config.apiUrl}/api/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
        } catch (error) {
            console.error('Error updating count:', error);
        }
    };

    return (
        <main className="fixed inset-0 flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center gap-6">
                <h1 className="text-gray-200 text-2xl">Current Tally</h1>
                <div className="text-gray-100 text-6xl font-bold">{count}</div>
                <div className="text-gray-400 text-sm">Active Users: {activeUsers}</div>
                <div className="flex gap-12">
                    <button
                        onClick={() => updateCount(1)}
                        className="p-4 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ThumbsUp size={40} className="text-gray-200" />
                    </button>
                    <button
                        onClick={() => updateCount(-1)}
                        className="p-4 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ThumbsDown size={40} className="text-gray-200" />
                    </button>
                </div>
            </div>
        </main>
    );
}

export default App;
