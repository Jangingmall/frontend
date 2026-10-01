"use client";
import "./seller-studio.css";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/ui/logo";

import { readSavedDraft, STORAGE_PREFIX } from "./studio-state";
export function StudioProjects() {
  const [projects, setProjects] = useState<
    { id: string; title: string; status: string }[]
  >([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const list = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key?.startsWith(STORAGE_PREFIX)) continue;
          try {
            const value = readSavedDraft(localStorage.getItem(key)!);
            list.push({
              id: key.slice(STORAGE_PREFIX.length),
              title: value.draft.product_name,
              status: value.status,
            });
          } catch {
            setError("일부 저장된 초안을 읽지 못했습니다.");
          }
        }
        setProjects(list);
      } catch {
        setError("브라우저 저장소에 접근할 수 없습니다.");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="ss-shell">
      <header className="ss-header">
        <Link className="ss-logo" href="/" aria-label="미담 홈으로 이동">
          <Logo />
        </Link>
        <span>판매 관리</span>
      </header>
      <div className="ss-form-wrap">
        <div className="ss-heading">
          <h1>나의 상세페이지</h1>
          <Link className="ss-button ss-primary" href="/seller/products/new">
            새로 만들기
          </Link>
        </div>
        <p className="ss-demo-note">
          이 브라우저에 저장한 시연 초안입니다. 실제 상품 목록과는 별도로
          보관됩니다.
        </p>
        {error && <p role="alert">{error}</p>}
        <ul className="ss-projects">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/seller/products/new?project=${encodeURIComponent(project.id)}`}
              >
                <strong>{project.title}</strong>
                <span>
                  {project.status === "result" ? "제작 완료" : "초안"} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {projects.length === 0 && (
          <p className="ss-loading">저장된 상세페이지가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
