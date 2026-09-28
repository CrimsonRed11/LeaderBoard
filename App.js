 import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ScrollView, StyleSheet, KeyboardAvoidingView,
  Platform, StatusBar, ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const C = {
  bg:      "#040E21",
  surface: "rgba(11,31,58,0.78)",
  accent:  "#1653bc",
  line:    "rgba(255,255,255,0.08)",
  white:   "#FFFFFF",
  muted:   "rgba(255,255,255,0.5)",
  red:     "#FF6B6B",
  gold:    "#F5C518",
  silver:  "#A8B8C8",
  bronze:  "#C87941",
  green:   "#4FFFB0",
};

const STORAGE_KEY = "SR_LEADERBOARD_V3";
const MEDALS      = ["🥇", "🥈", "🥉"];
const MEDAL_COLS  = [C.gold, C.silver, C.bronze];
const ADMIN_PW    = "47";

const getAnimalRating = (t) => {
  if (t < 0.20) return { animal: "Cheetah",        emoji: "🐆", color: "#F5C518" };
  if (t < 0.30) return { animal: "Snake",           emoji: "🐍", color: "#4FFFB0" };
  if (t < 0.45) return { animal: "Humpback Whale",  emoji: "🐋", color: "#60AAFF" };
  return               { animal: "Tortoise",        emoji: "🐢", color: "#FF6B6B" };
};

// ─── Background ──────────────────────────────────────────────────────────────
function BG() {
  return (
    <ImageBackground source={require("./background.png")} style={StyleSheet.absoluteFill}>
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(4,14,33,0.65)" }} />
    </ImageBackground>
  );
}

// ─── Admin modal (shared: delete, clear, unlock) ──────────────────────────────
function AdminModal({ title, subtitle, confirmLabel, confirmColor, onConfirm, onCancel, pw, setPw, pwErr }) {
  return (
    <View style={s.modal}>
      <View style={s.modalBox}>
        <Text style={s.modalTitle}>{title}</Text>
        {!!subtitle && <Text style={s.modalSub}>{subtitle}</Text>}
        <TextInput
          style={[s.input, { marginTop: 14, textAlign: "center", letterSpacing: 6, fontSize: 22 }]}
          value={pw}
          onChangeText={setPw}
          secureTextEntry
          keyboardType="number-pad"
          placeholder="· · · ·"
          placeholderTextColor={C.muted}
          autoFocus
          maxLength={8}
          onSubmitEditing={onConfirm}
        />
        {!!pwErr && <Text style={s.pwErr}>{pwErr}</Text>}
        <TouchableOpacity
          style={[s.primaryBtn, { marginTop: 18, backgroundColor: confirmColor || C.accent }]}
          onPress={onConfirm}
        >
          <Text style={s.btnTxt}>{confirmLabel || "Confirm"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.ghostBtn, { marginTop: 8 }]} onPress={onCancel}>
          <Text style={s.btnTxt}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,      setScreen]      = useState("leaderboard");
  const [entries,     setEntries]     = useState([]);
  const [adminMode,   setAdminMode]   = useState(false); // false = display mode

  const [nameVal, setNameVal] = useState("");
  const [teamVal, setTeamVal] = useState("");
  const [timeVal, setTimeVal] = useState("");
  const [error,   setError]   = useState("");

  // Modal: "unlock" | "lock" | "delete" | "clear" | null
  const [modalType,     setModalType]     = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pw,    setPw]    = useState("");
  const [pwErr, setPwErr] = useState("");

  const sorted = [...entries].sort((a, b) => a.time - b.time);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => raw && setEntries(JSON.parse(raw)))
      .catch(() => {});
  }, []);

  const save = async (list) => {
    setEntries(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list)).catch(() => {});
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openModal = (type, id = null) => {
    setPw(""); setPwErr("");
    setPendingDelete(id);
    setModalType(type);
  };

  const closeModal = () => {
    setModalType(null);
    setPendingDelete(null);
    setPw(""); setPwErr("");
  };

  const confirmAdmin = async () => {
    if (pw.trim() !== ADMIN_PW) {
      setPwErr("Incorrect password");
      setPw("");
      return;
    }
    if (modalType === "unlock") {
      setAdminMode(true);
    } else if (modalType === "delete" && pendingDelete) {
      await save(entries.filter(e => e.id !== pendingDelete));
    } else if (modalType === "clear") {
      await save([]);
    }
    closeModal();
  };

  // Lock doesn't need a password — just a confirmation tap
  const handleLock = () => {
    setAdminMode(false);
    setScreen("leaderboard");
  };

  // ── Add handler ────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    setError("");
    if (!nameVal.trim()) return setError("Enter name");
    if (!teamVal.trim()) return setError("Enter team");
    const num = parseFloat(timeVal);
    if (isNaN(num) || num <= 0) return setError("Enter valid time");
    const t = num > 10 ? num / 1000 : num;
    const entry = {
      id:     Date.now().toString(),
      name:   nameVal.trim(),
      team:   teamVal.trim(),
      time:   t,
      rating: getAnimalRating(t),
    };
    await save([...entries, entry]);
    setNameVal(""); setTeamVal(""); setTimeVal("");
    setScreen("leaderboard");
  };

  // ── LEADERBOARD ────────────────────────────────────────────────────────────
  if (screen === "leaderboard") return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <BG />

      {/* Header */}
      <View style={s.header}>
        <Image source={require("./logo.png")} style={s.logo} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={s.brand}>Silver Racing</Text>
          <Text style={s.sub}>STEM Racing World Finals 2026</Text>
        </View>

        {/* Mode indicator + toggle */}
        {adminMode ? (
          <View style={s.headerRight}>
            <TouchableOpacity style={s.addBtn} onPress={() => setScreen("add")}>
              <Text style={s.addBtnTxt}>+ Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.lockBtn} onPress={handleLock}>
              <Text style={s.lockIcon}>🔓</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.lockBtn} onPress={() => openModal("unlock")}>
            <Text style={s.lockIcon}>🔒</Text>
          </TouchableOpacity>
        )}
      </View>

     

      {/* Title */}
      <View style={s.lbTitleRow}>
        <Text style={s.eyebrow}>REACTION TIME</Text>
        <Text style={s.lbTitle}>Leaderboard</Text>
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.lbList}
        showsVerticalScrollIndicator={false}
      >
        {sorted.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>No times yet</Text>
            <Text style={s.emptySub}>
              {adminMode ? "Tap + Add to record the first time" : "Unlock admin mode to add times"}
            </Text>
          </View>
        )}

        {sorted.map((e, i) => {
          const { emoji, animal, color } = e.rating;
          const mc = i < 3 ? MEDAL_COLS[i] : null;
          return (
            <View key={e.id} style={[s.row, mc && { borderColor: mc + "55" }]}>
              <View style={[s.rankBox, mc && { backgroundColor: mc + "22" }]}>
                <Text style={[s.rankTxt, { color: mc || C.muted }]}>
                  {i < 3 ? MEDALS[i] : i + 1}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[s.name, mc && { color: mc }]} numberOfLines={1}>{e.name}</Text>
                <Text style={s.teamTxt}>{e.team}</Text>
                <Text style={[s.animalTxt, { color }]}>{emoji}  {animal}</Text>
              </View>

              <Text style={[s.time, mc && { color: mc }]}>{e.time.toFixed(3)}s</Text>

              {/* Only show delete in admin mode */}
              {adminMode && (
                <TouchableOpacity
                  onPress={() => openModal("delete", e.id)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={{ paddingLeft: 10 }}
                >
                  <Text style={s.delTxt}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {adminMode && sorted.length > 0 && (
          <TouchableOpacity style={s.clearBtn} onPress={() => openModal("clear")}>
            <Text style={s.clearTxt}>Clear all times</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Admin modal */}
      {!!modalType && (
        <AdminModal
          title={
            modalType === "unlock" ? "Admin Access" :
            modalType === "delete" ? "Remove Entry" :
            "Clear All Times"
          }
          subtitle={
            modalType === "unlock"
              ? "Enter password to unlock admin mode"
              : "Enter admin password to continue"
          }
          confirmLabel={
            modalType === "unlock" ? "Unlock" :
            modalType === "delete" ? "Remove" :
            "Clear All"
          }
          confirmColor={modalType === "unlock" ? C.accent : C.red}
          onConfirm={confirmAdmin}
          onCancel={closeModal}
          pw={pw}
          setPw={setPw}
          pwErr={pwErr}
        />
      )}
    </View>
  );

  // ── ADD TIME ───────────────────────────────────────────────────────────────
  if (screen === "add") return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />
      <BG />
      <ScrollView contentContainerStyle={s.addPage} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <Image source={require("./logo.png")} style={s.logo} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={s.brand}>Silver Racing</Text>
            <Text style={s.sub}>STEM Racing · UK Nationals</Text>
          </View>
          <TouchableOpacity style={s.lockBtn} onPress={handleLock}>
            <Text style={s.lockIcon}>🔓</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.lbTitle}>Add Time</Text>

        <View style={s.card}>
          <Text style={s.fieldLabel}>Driver Name</Text>
          <TextInput
            style={s.input}
            value={nameVal}
            onChangeText={setNameVal}
            placeholderTextColor={C.muted}
            autoFocus
            maxLength={30}
            returnKeyType="next"
          />

          <View style={{ height: 16 }} />

          <Text style={s.fieldLabel}>Team Name</Text>
          <TextInput
            style={s.input}
            value={teamVal}
            onChangeText={setTeamVal}
            placeholderTextColor={C.muted}
            maxLength={30}
            returnKeyType="next"
          />

          <View style={{ height: 16 }} />

          <Text style={s.fieldLabel}>Reaction Time</Text>
          <TextInput
            style={s.input}
            value={timeVal}
            onChangeText={setTimeVal}
            placeholder="0.312 s  or  312 ms"
            placeholderTextColor={C.muted}
            keyboardType="decimal-pad"
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />

          {!!error && <Text style={s.errTxt}>{error}</Text>}
        </View>

        <TouchableOpacity style={[s.primaryBtn, { marginTop: 16 }]} onPress={handleAdd}>
          <Text style={s.btnTxt}>Save Time</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.ghostBtn, { marginTop: 10 }]}
          onPress={() => { setError(""); setScreen("leaderboard"); }}
        >
          <Text style={s.btnTxt}>Cancel</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );

  return null;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const PAD = 20;
const TOP = Platform.OS === "ios" ? 54 : 34;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PAD,
    paddingTop: TOP,
    paddingBottom: 14,
    gap: 14,
  },
  logo:       { width: 56, height: 56, borderRadius: 10 },
  brand:      { color: C.white, fontWeight: "700", fontSize: 19, letterSpacing: 0.2 },
  sub:        { color: C.muted, fontSize: 12, marginTop: 2 },
  headerRight:{ flexDirection: "row", alignItems: "center", gap: 8 },
  addBtn:     { backgroundColor: C.accent, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 20 },
  addBtnTxt:  { color: C.white, fontWeight: "700", fontSize: 14 },
  lockBtn:    { padding: 6 },
  lockIcon:   { fontSize: 22 },

  // Display mode banner
  displayBanner: {
    marginHorizontal: PAD,
    marginBottom: 10,
    backgroundColor: "rgba(22,83,188,0.18)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(22,83,188,0.35)",
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  displayBannerTxt: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },

  // Leaderboard
  lbTitleRow: { paddingHorizontal: PAD, marginBottom: 12 },
  eyebrow:    { fontSize: 10, fontWeight: "700", color: C.accent, letterSpacing: 2.5, marginBottom: 4 },
  lbTitle:    { fontSize: 30, fontWeight: "700", color: C.white, letterSpacing: -0.5 },
  lbList:     { paddingHorizontal: PAD, paddingBottom: 32 },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  rankBox: {
    width: 38, height: 38,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  rankTxt:   { fontSize: 16, fontWeight: "700" },
  name:      { color: C.white, fontSize: 15, fontWeight: "600", marginBottom: 2 },
  teamTxt:   { color: C.muted, fontSize: 12, marginBottom: 3 },
  animalTxt: { fontSize: 12, fontWeight: "600" },
  time:      { color: C.white, fontWeight: "700", fontSize: 18, letterSpacing: -0.5, marginRight: 4 },
  delTxt:    { color: C.muted, fontSize: 14, opacity: 0.5 },

  // Empty
  emptyState: { alignItems: "center", paddingTop: 72, paddingBottom: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.white, marginBottom: 6 },
  emptySub:   { fontSize: 14, color: C.muted, textAlign: "center" },

  // Clear
  clearBtn: { marginTop: 8, alignItems: "center", paddingVertical: 12 },
  clearTxt: { color: C.red, fontSize: 13, opacity: 0.7, fontWeight: "500" },

  // Add page
  addPage: { paddingHorizontal: PAD, paddingBottom: 40 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11, fontWeight: "600", color: C.muted,
    letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(22,83,188,0.45)",
    borderRadius: 10,
    padding: 14,
    color: C.white,
    fontSize: 16,
    fontWeight: "500",
  },
  errTxt: { color: C.red, fontSize: 13, marginTop: 10 },

  // Buttons
  primaryBtn: {
    backgroundColor: C.accent,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  ghostBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  btnTxt: { color: C.white, fontSize: 16, fontWeight: "600" },

  // Modal
  modal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4,14,33,0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  modalBox: {
    backgroundColor: "#0B1F3A",
    padding: 28,
    borderRadius: 20,
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
  },
  modalTitle: { color: C.white, fontWeight: "700", fontSize: 20, marginBottom: 4 },
  modalSub:   { color: C.muted, fontSize: 13, textAlign: "center" },
  pwErr:      { color: C.red, fontSize: 13, marginTop: 6 },
});