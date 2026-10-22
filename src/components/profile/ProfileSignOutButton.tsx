"use client";

import React, { useState } from "react";
import { SignOut } from "@phosphor-icons/react";
import { LogoutConfirmModal } from "@/components/auth/LogoutConfirmModal";

export interface ProfileSignOutButtonProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function ProfileSignOutButton({
  userName,
  userEmail,
}: ProfileSignOutButtonProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirmModal(true)}
        className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-900/40 hover:border-red-500/60 cursor-pointer"
        title="Keluar dari akun"
      >
        <SignOut size={16} />
        <span>Keluar</span>
      </button>

      <LogoutConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        userName={userName}
        userEmail={userEmail}
      />
    </>
  );
}
