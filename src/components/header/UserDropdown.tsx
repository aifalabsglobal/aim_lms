"use client";
import React from "react";
import { UserButton } from "@clerk/nextjs";

export default function UserDropdown() {
  return (
    <div className="relative">
      <UserButton />
    </div>
  );
}
