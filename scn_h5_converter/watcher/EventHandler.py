from watchdog.events import FileSystemEvent
import asyncio
from datetime import datetime
from typing import Dict
from enum import Enum
from hachiko import hachiko


class ChangeType(Enum):
    MODIFIED = 1
    DELETED = 2


class FileChange(object):
    file: str
    type: ChangeType
    when: datetime

    def __init__(self, file: str, type: ChangeType, when: datetime):
        self.file = file
        self.type = type
        self.when = when

    def __repr__(self):
        return f"{self.file} {self.type} at {self.when}"


class EventHandler(hachiko.AIOEventHandler):
    suffix: str
    files_being_watched: Dict[str, FileChange]

    def __init__(self, suffix_to_watch: str, files_being_watched: Dict[str, FileChange], lock: asyncio.locks.Lock):
        super().__init__()
        self.suffix = suffix_to_watch
        self.files_being_watched = files_being_watched
        self.lock = lock

    def dispatch(self, event: FileSystemEvent):
        if event.src_path.endswith(self.suffix) and not event.is_directory:
            return super().dispatch(event)
        return None

    async def on_created(self, event):
        async with self.lock:
            self.files_being_watched[event.src_path] = FileChange(event.src_path, ChangeType.MODIFIED, datetime.now())
        return super().on_created(event)

    async def on_modified(self, event):
        async with self.lock:
            self.files_being_watched[event.src_path] = FileChange(event.src_path, ChangeType.MODIFIED, datetime.now())
        return super().on_modified(event)

    async def on_deleted(self, event):
        async with self.lock:
            self.files_being_watched[event.src_path] = FileChange(event.src_path, ChangeType.DELETED, datetime.now())
        return super().on_deleted(event)

    async def on_moved(self, event):
        async with self.lock:
            self.files_being_watched[event.src_path] = FileChange(event.src_path, ChangeType.DELETED, datetime.now())
            self.files_being_watched[event.dest_path] = FileChange(event.dest_path, ChangeType.MODIFIED, datetime.now())
        return super().on_moved(event)
