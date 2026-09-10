import api from "../../lib/axiosInstance";

export async function getCampuses() {
  const { data } = await api.get("/campuses");
  return data;
}

export async function createCampus(values) {
  const { data } = await api.post("/campuses", values);
  return data;
}

export async function joinCampus(inviteCode) {
  const { data } = await api.post("/campuses/join", {
    inviteCode,
  });
  return data;
}

export async function getCampusById(campusId) {
  const { data } = await api.get(`/campuses/${campusId}`);
  return data;
}

export async function updateCampus(campusId, values) {
  const { data } = await api.patch(
    `/campuses/${campusId}`,
    values
  );
  return data;
}

export async function getCampusInvite(inviteCode) {
  const { data } = await api.get(
    `/campuses/invite/${encodeURIComponent(inviteCode)}`
  );
  return data;
}

export async function leaveCampus(campusId) {
  const { data } = await api.post(
    `/campuses/${campusId}/leave`
  );
  return data;
}

export async function deleteCampus(campusId) {
  const { data } = await api.delete(
    `/campuses/${campusId}`
  );

  return data;
}