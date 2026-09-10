import api from "../../lib/axiosInstance";

export async function getRoomMessages(roomId) {
  const { data } = await api.get(`/messages/${roomId}`);

  if (!Array.isArray(data.messages)) {
    throw new Error("Invalid messages response");
  }

  return data.messages;
}