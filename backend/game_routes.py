from typing import Dict

from fastapi import (APIRouter, Depends, HTTPException, WebSocket,
                     WebSocketDisconnect, status)
from sqlalchemy.orm import Session

from backend import schemas

from . import crud, models
from .auth import authenticate_access_token
from .db import get_db
from .game import GameManager

game_router = APIRouter(prefix="/api")


@game_router.post("/create_game/")
async def create_game(
    game: schemas.GameCreate,
    user: models.User = Depends(authenticate_access_token),
    db: Session = Depends(get_db),
):
    user_scheme = schemas.User.from_orm(user)
    created_game = await crud.create_game(db, user_scheme, game)
    return created_game


@game_router.get("/game")
async def get_game(game_id: int, db: Session = Depends(get_db)):
    game = await crud.get_live_game(db, game_id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested game does not exist",
        )
    return game


managers: Dict[int, GameManager] = dict()


@game_router.websocket("/game/{game_id}/")
async def run_game(game_id: int, websocket: WebSocket):

    await websocket.accept()
    db = next(get_db())

    verified = False
    while not verified:
        data = await websocket.receive_text()
        try:
            user = await authenticate_access_token(data, db)
        except HTTPException:
            await websocket.close(reason="Invalid Credentials")
            return

        verified = True
        if not db.query(models.LiveGame).filter_by(id=game_id).first():
            await websocket.close(reason="Game doesn't exist")
            return

        if not managers.get(game_id):
            manager = GameManager(game_id, db)
            managers[game_id] = manager
        else:
            manager = managers[game_id]
            verified = True
        await manager.connect(user, websocket)
        break

    if verified:
        try:
            while True:
                data = await websocket.receive_json()
                await manager.handle_command(data, websocket)
        except WebSocketDisconnect:
            manager.disconnect(websocket)


@game_router.get("/test/")
async def test():
    return {"hello": "mike"}
