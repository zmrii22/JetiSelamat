export const mesejRalatMesra = (error: unknown, fallback = 'Ralat berlaku. Sila cuba lagi.') => {
  const e = error as { code?: string; message?: string } | undefined;
  const code = e?.code ?? '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Emel atau kata laluan tidak tepat.';
    case 'auth/invalid-email':
      return 'Format emel tidak sah.';
    case 'auth/email-already-in-use':
      return 'Emel ini sudah digunakan. Sila log masuk atau guna emel lain.';
    case 'auth/weak-password':
      return 'Kata laluan terlalu lemah. Gunakan sekurang-kurangnya 6 aksara.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak cubaan. Sila cuba semula sebentar lagi.';
    case 'auth/network-request-failed':
      return 'Ralat rangkaian. Sila semak internet anda.';
    case 'auth/operation-not-allowed':
      return 'Login emel/kata laluan belum diaktifkan di Firebase.';
    case 'auth/invalid-action-code':
      return 'Pautan reset tidak sah atau telah tamat tempoh.';
    default:
      return e?.message && !e.message.includes('Firebase: Error') ? e.message : fallback;
  }
};
