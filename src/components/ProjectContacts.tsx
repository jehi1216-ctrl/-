"use client";

import { useTransition } from "react";
import { addContact, deleteContact } from "@/app/(main)/projects/contacts-actions";
import type { ProjectContact } from "@/types/project";

export default function ProjectContacts({
  projectId,
  contacts,
}: {
  projectId: string;
  contacts: ProjectContact[];
}) {
  const [isPending, startTransition] = useTransition();
  const boundAdd = addContact.bind(null, projectId);

  function handleDelete(contactId: string) {
    startTransition(() => deleteContact(projectId, contactId));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-3 text-sm font-medium text-gray-500">협력업체</h2>

      {contacts.length === 0 ? (
        <p className="mb-3 text-sm text-gray-400">등록된 협력업체가 없어요.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {contacts.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-md border border-gray-100 px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">{c.company}</span>
                {c.trade && (
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {c.trade}
                  </span>
                )}
                {(c.contact_name || c.phone) && (
                  <p className="text-xs text-gray-500">
                    {[c.contact_name, c.phone].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                disabled={isPending}
                className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <form action={boundAdd} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input
          name="company"
          required
          placeholder="업체명 *"
          className="col-span-2 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:col-span-1"
        />
        <input
          name="trade"
          placeholder="공종"
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <input
          name="contact_name"
          placeholder="담당자명"
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <input
          name="phone"
          placeholder="전화번호"
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="col-span-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 sm:col-span-4"
        >
          추가
        </button>
      </form>
    </div>
  );
}
