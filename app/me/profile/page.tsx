"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, UserProfile } from "@/lib/supabase";
import Header from "@/components/Header";

const DEFAULT_AVATARS = [
  "/avatars/default-1.png",
  "/avatars/default-2.png",
  "/avatars/default-3.png",
  "/avatars/default-4.png",
  "/avatars/default-5.png",
];

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // 表单字段
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [pickupName, setPickupName] = useState("");
  const [phone, setPhone] = useState("");
  const [wechatId, setWechatId] = useState("");
  const [preferenceNote, setPreferenceNote] = useState("");

  // 头像选择弹窗
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // 修改密码弹窗
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    // 查询用户资料
    let { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // 如果没有资料，自动创建
    if (!profileData) {
      const defaultNickname = "面包朋友" + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
      const { data: newProfile } = await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          email: user.email,
          nickname: defaultNickname,
          avatar_url: DEFAULT_AVATARS[0],
        })
        .select()
        .single();
      profileData = newProfile;
    }

    if (profileData) {
      setProfile(profileData as UserProfile);
      setNickname(profileData.nickname || "");
      setAvatarUrl(profileData.avatar_url || DEFAULT_AVATARS[0]);
      setPickupName(profileData.pickup_name || "");
      setPhone(profileData.phone || "");
      setWechatId(profileData.wechat_id || "");
      setPreferenceNote(profileData.preference_note || "");
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      setMessage({ type: "error", text: "昵称不能为空" });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    const { error } = await supabase
      .from("user_profiles")
      .update({
        nickname: nickname.trim(),
        avatar_url: avatarUrl,
        pickup_name: pickupName.trim() || null,
        phone: phone.trim() || null,
        wechat_id: wechatId.trim() || null,
        preference_note: preferenceNote.trim() || null,
      })
      .eq("id", profile?.id);

    if (error) {
      setMessage({ type: "error", text: "保存失败：" + error.message });
    } else {
      setMessage({ type: "success", text: "个人信息已保存" });
      // 刷新数据
      loadProfile();
    }

    setSaving(false);
  };

  const handleChangePassword = async () => {
    setPasswordError("");

    if (!newPassword) {
      setPasswordError("请输入新密码");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("密码至少 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("两次密码不一致");
      return;
    }

    setPasswordSaving(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError("修改失败：" + error.message);
    } else {
      setMessage({ type: "success", text: "密码修改成功" });
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    }

    setPasswordSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-amber-600">加载中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-amber-800 mb-6">个人信息</h1>

        {message.text && (
          <div
            className={`mb-4 px-4 py-3 rounded-xl text-sm ${
              message.type === "error"
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-green-50 border border-green-200 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 基础资料 */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">基础资料</h2>

          {/* 头像 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">头像</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 overflow-hidden">
                <img
                  src={avatarUrl || DEFAULT_AVATARS[0]}
                  alt="头像"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='25' fill='%23f59e0b'/%3E%3Ccircle cx='50' cy='100' r='40' fill='%23f59e0b'/%3E%3C/svg%3E";
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(true)}
                className="px-4 py-2 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
              >
                更换头像
              </button>
            </div>
          </div>

          {/* 昵称 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              昵称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* 登录邮箱 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">登录邮箱</label>
            <input
              type="text"
              value={profile?.email || ""}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
            />
          </div>

          {/* 默认领取人姓名 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">默认领取人姓名</label>
            <input
              type="text"
              value={pickupName}
              onChange={(e) => setPickupName(e.target.value)}
              placeholder="预约时默认带出"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* 手机号 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="预约时默认带出"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* 微信号 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">微信号</label>
            <input
              type="text"
              value={wechatId}
              onChange={(e) => setWechatId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* 偏好备注 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">偏好备注</label>
            <textarea
              value={preferenceNote}
              onChange={(e) => setPreferenceNote(e.target.value)}
              placeholder="例如：不要坚果、喜欢全麦"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          {/* 注册时间 & 更新时间 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">注册时间</label>
              <div className="text-sm text-gray-500">
                {profile?.created_at ? formatDateTime(profile.created_at) : "-"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最近更新</label>
              <div className="text-sm text-gray-500">
                {profile?.updated_at ? formatDateTime(profile.updated_at) : "-"}
              </div>
            </div>
          </div>

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors disabled:bg-amber-300"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>

        {/* 账号安全 */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">账号安全</h2>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <div className="text-sm font-medium text-gray-700">登录密码</div>
              <div className="text-sm text-gray-400">********</div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              修改密码
            </button>
          </div>

          <div className="pt-4">
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>

      {/* 头像选择弹窗 */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">选择头像</h3>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {DEFAULT_AVATARS.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setAvatarUrl(avatar);
                    setShowAvatarPicker(false);
                  }}
                  className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-colors ${
                    avatarUrl === avatar ? "border-amber-500" : "border-transparent"
                  }`}
                >
                  <img
                    src={avatar}
                    alt={`头像 ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23${['f59e0b', 'ef4444', '10b981', '3b82f6', '8b5cf6'][index]}' width='100' height='100'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='40'%3E${index + 1}%3C/text%3E%3C/svg%3E`;
                    }}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAvatarPicker(false)}
              className="w-full py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">修改密码</h3>

            {passwordError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {passwordError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 6 位"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError("");
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors disabled:bg-amber-300"
              >
                {passwordSaving ? "修改中..." : "确认修改"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
