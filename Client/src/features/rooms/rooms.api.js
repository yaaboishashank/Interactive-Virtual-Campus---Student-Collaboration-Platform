import api from "../../lib/axiosInstance";

export async function getCampusRooms(campusId) {
  const { data } = await api.get(`/rooms/${campusId}`);
  return data.rooms;
}

export async function getRoomById(roomId) {
  const { data } = await api.get(`/rooms/details/${roomId}`);
  return data.room;
}

export async function createRoom(campusId, values) {
  const { data } = await api.post(
    `/rooms/${campusId}`,
    values
  );

  return data.room;
}

export async function updateRoom(roomId, values) {
  const { data } = await api.patch(
    `/rooms/${roomId}`,
    values
  );

  return data.room;
}

export async function deleteRoom(roomId) {
  const { data } = await api.delete(`/rooms/${roomId}`);
  return data;
}