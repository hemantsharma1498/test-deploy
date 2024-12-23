from fastapi import FastAPI, Request, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from redis import Redis
from pydantic import BaseModel
from typing import Literal, cast
import json

from starlette.types import ExceptionHandler
from .config import settings
from .redis_client import get_redis

app = FastAPI()
connected_clients = set()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Action(BaseModel):
    action: Literal[1, -1]


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, redis: Redis = Depends(get_redis)):

    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        connected_clients.remove(websocket)
        redis.delete(websocket.headers['X-Real-IP'])
        redis.decr("active_users")
    finally:
        connected_clients.remove(websocket)
        redis.decr("active_users")


@app.post("/api/action")
async def set_action(action: Action, redis: Redis = Depends(get_redis)):
    if action.action == 1:
        redis.incr("final_count")
    else:
        redis.decr("final_count")
    count = int(redis.get("final_count") or 0)
    active_users = int(redis.get("active_users") or 0)

    for client in connected_clients:
        await client.send_json({"final_count": count, "active_users": active_users})
    return {"final_count": count}


@app.get("/api/count")
async def get_count(request: Request, redis: Redis = Depends(get_redis)):
    req_user_ip = request.headers.get(
        'X-Real-IP', "0.0.0.0")  # fallback to client IP
    count = int(redis.get("final_count") or 0)
    active_users = int(redis.get("active_users") or 0)

    if not redis.get(req_user_ip):
        redis.set(req_user_ip, "1")
        redis.incr("active_users")
    return {"final_count": count, "active_users": active_users}


@app.get("/api/health")
async def read_root(redis: Redis = Depends(get_redis)):
    # Example of using both DB and Redis
    try:
        # Try to get data from cache
        cached_data = redis.get("health_check")
        if cached_data:
            return json.loads(cached_data)

        # If not in cache, create new response
        response = {"status": "healthy", "message": "Server is running"}

        # Store in cache for 1 minute
        redis.setex("health_check", 60, json.dumps(response))
        return response

    except Exception as e:
        return {"status": "error", "message": str(e)}
