"use client";

/**
 * 按钮预览页 — /debug/buttons
 * 直接读取 tokens.css 中真实的 .btn-primary 样式，不做任何调试覆盖
 */

export default function ButtonPreviewPage() {
  return (
    <main className="min-h-screen p-12" style={{ backgroundColor: "var(--color-bg-page)" }}>
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text-title)" }}>
            主按钮预览
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            来自 <code className="px-1 rounded" style={{ backgroundColor: "var(--color-bg-cream)" }}>tokens.css → --btn-primary-*</code> 的真实样式
          </p>
        </header>

        <section
          className="rounded-2xl p-12 grid grid-cols-2 gap-x-8 gap-y-12 place-items-center"
          style={{
            backgroundColor: "var(--color-bg-cream)",
            border: "1px solid var(--color-border-light)",
          }}
        >
          {/* default */}
          <div className="flex flex-col items-center gap-3">
            <button className="btn-primary">View Bread</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              default
            </span>
          </div>

          {/* hover (auto on real mouse hover) */}
          <div className="flex flex-col items-center gap-3">
            <button className="btn-primary">Hover me</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              悬停查看 hover
            </span>
          </div>

          {/* active (auto on real click) */}
          <div className="flex flex-col items-center gap-3">
            <button className="btn-primary">Click & hold</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              点击查看 active
            </span>
          </div>

          {/* disabled */}
          <div className="flex flex-col items-center gap-3">
            <button className="btn-primary" disabled>
              View Bread
            </button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              disabled
            </span>
          </div>
        </section>

        {/* 主按钮 尺寸 */}
        <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: "var(--color-text-primary)" }}>
          .btn-primary — 尺寸
        </h2>
        <section
          className="rounded-2xl p-10 flex flex-row items-end gap-8"
          style={{
            backgroundColor: "var(--color-bg-cream)",
            border: "1px solid var(--color-border-light)",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <button className="btn-primary">View Bread</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>L（默认）</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button className="btn-primary btn--m">View Bread</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>M</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button className="btn-primary btn--s">View Bread</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>S</span>
          </div>
        </section>

        {/* 草莓红主行动按钮 */}
        <h2 className="text-lg font-bold mt-12 mb-3" style={{ color: "var(--color-text-primary)" }}>
          .btn-coral — 草莓红主行动按钮
        </h2>
        <section
          className="rounded-2xl p-12 grid grid-cols-2 gap-x-8 gap-y-12 place-items-center"
          style={{
            backgroundColor: "var(--color-bg-cream)",
            border: "1px solid var(--color-border-light)",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <button className="btn-coral">立即预约</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>default</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button className="btn-coral">Hover me</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>悬停查看 hover</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button className="btn-coral">Click & hold</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>点击查看 active</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button className="btn-coral" disabled>立即预约</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>disabled</span>
          </div>
        </section>

        {/* 草莓红 尺寸 */}
        <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: "var(--color-text-primary)" }}>
          .btn-coral — 尺寸
        </h2>
        <section
          className="rounded-2xl p-10 flex flex-row items-end gap-8"
          style={{
            backgroundColor: "var(--color-bg-cream)",
            border: "1px solid var(--color-border-light)",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <button className="btn-coral">立即预约</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>L（默认）</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button className="btn-coral btn--m">立即预约</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>M</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button className="btn-coral btn--s">立即预约</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>S</span>
          </div>
        </section>

        {/* 次按钮 */}
        <h2 className="text-lg font-bold mt-12 mb-3" style={{ color: "var(--color-text-primary)" }}>
          .btn-secondary — 次按钮（取消 / 返回 / 再想想）
        </h2>
        <section
          className="rounded-2xl p-12 grid grid-cols-2 gap-x-8 gap-y-12 place-items-center"
          style={{
            backgroundColor: "var(--color-bg-cream)",
            border: "1px solid var(--color-border-light)",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <button className="btn-secondary">再想想</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>default</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button className="btn-secondary">Hover me</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>悬停查看 hover</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button className="btn-secondary">Click & hold</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>点击查看 active</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button className="btn-secondary" disabled>取消</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>disabled</span>
          </div>
        </section>

        {/* 次按钮 尺寸 */}
        <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: "var(--color-text-primary)" }}>
          .btn-secondary — 尺寸
        </h2>
        <section
          className="rounded-2xl p-10 flex flex-row items-end gap-8"
          style={{
            backgroundColor: "var(--color-bg-cream)",
            border: "1px solid var(--color-border-light)",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <button className="btn-secondary">再想想</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>L（默认）</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button className="btn-secondary btn--m">再想想</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>M</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button className="btn-secondary btn--s">再想想</button>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>S</span>
          </div>
        </section>

        {/* 文字按钮 */}
        <h2 className="text-lg font-bold mt-12 mb-3" style={{ color: "var(--color-text-primary)" }}>
          .btn-text — 文字按钮（低优先级 / 纯文字操作）
        </h2>
        <section
          className="rounded-2xl p-12 grid grid-cols-3 gap-x-6 gap-y-10 place-items-center"
          style={{
            backgroundColor: "var(--color-bg-cream)",
            border: "1px solid var(--color-border-light)",
          }}
        >
          {/* Primary 主棕 */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs mb-1" style={{ color: "var(--color-text-tertiary)" }}>Text Primary（主棕）</span>
            <button className="btn-text">查看更多</button>
            <button className="btn-text is-pressed">查看更多</button>
            <button className="btn-text" disabled>查看更多</button>
          </div>

          {/* Action 草莓红 */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs mb-1" style={{ color: "var(--color-text-tertiary)" }}>Text Action（草莓红）</span>
            <button className="btn-text btn-text-action">立即预约</button>
            <button className="btn-text btn-text-action is-pressed">立即预约</button>
            <button className="btn-text btn-text-action" disabled>立即预约</button>
          </div>

          {/* Danger 强调红 */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs mb-1" style={{ color: "var(--color-text-tertiary)" }}>Text Danger（强调红）</span>
            <button className="btn-text btn-text-danger">删除</button>
            <button className="btn-text btn-text-danger is-pressed">删除</button>
            <button className="btn-text btn-text-danger" disabled>删除</button>
          </div>

          <p className="col-span-3 text-xs text-center mt-2" style={{ color: "var(--color-text-tertiary)" }}>
            每列从上到下：normal → active → disabled。鼠标悬停看 hover。
          </p>
        </section>
      </div>
    </main>
  );
}
