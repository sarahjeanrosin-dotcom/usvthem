"use client";

import { useState } from "react";
import type { Permissions } from "@/lib/permissions";

interface Props {
  userId: string;
  permissions: Permissions;
  isSelf?: boolean;
}

const LABELS: { key: keyof Permissions; label: string }[] = [
  { key: "can_view_history", label: "View History" },
  { key: "can_create_battlecards", label: "Create Battle Cards" },
  { key: "can_edit_us", label: "Edit Us" },
  { key: "can_edit_them", label: "Edit Them" },
  { key: "can_manage_users", label: "Manage Users" },
];

export function PermissionToggles({ userId, permissions: initial, isSelf }: Props) {
  const [permissions, setPermissions] = useState(initial);
  const [saving, setSaving] = useState<keyof Permissions | null>(null);
  const [error, setError] = useState("");

  async function toggle(key: keyof Permissions) {
    const disabled = isSelf && key === "can_manage_users";
    if (disabled) return;

    const nextValue = !permissions[key];
    setSaving(key);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: nextValue }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to update permission");
      setPermissions((prev) => ({ ...prev, [key]: nextValue }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update permission");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {LABELS.map(({ key, label }) => {
        const active = permissions[key];
        const disabled = (isSelf && key === "can_manage_users") || saving === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            disabled={disabled}
            title={
              isSelf && key === "can_manage_users"
                ? "You cannot remove your own user-management access"
                : undefined
            }
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
              active
                ? "border-brand-blue bg-brand-blue-ice text-brand-navy"
                : "border-gray-200 text-gray-text hover:border-brand-blue/50"
            }`}
          >
            {label}
          </button>
        );
      })}
      {error && <span className="w-full text-xs text-red-500">{error}</span>}
    </div>
  );
}
