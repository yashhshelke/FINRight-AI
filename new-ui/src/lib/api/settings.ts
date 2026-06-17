import { apiFetch } from "./client";

export const SettingsAPI = {
  get: () => apiFetch<any>("/api/users/settings/"),

  update: (data: Record<string, any>) =>
    apiFetch<any>("/api/users/settings/", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getFullProfile: () => apiFetch<any>("/api/users/profile/full/"),

  changePassword: (data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }) =>
    apiFetch<any>("/api/users/change-password/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  exportData: () =>
    apiFetch<any>("/api/users/export-data/", { method: "POST" }),
};

export const NotificationsAPI = {
  list: () => apiFetch<any[]>("/api/users/notifications/"),

  markRead: (id: number) =>
    apiFetch<any>(`/api/users/notifications/${id}/read/`, { method: "POST" }),

  markAllRead: () =>
    apiFetch<any>("/api/users/notifications/mark-all-read/", { method: "POST" }),

  deleteNotif: (id: number) =>
    apiFetch<void>(`/api/users/notifications/${id}/delete/`, { method: "DELETE" }),
};

export const CardsAPI = {
  list: () => apiFetch<any[]>("/api/users/cards/"),

  add: (data: {
    card_number: string;
    card_holder: string;
    expiry: string;
    card_type: string;
    gradient_index: number;
  }) =>
    apiFetch<any>("/api/users/cards/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    apiFetch<any>(`/api/users/cards/${id}/`, { method: "DELETE" }),
};
