self.onmessage = (e: MessageEvent) => {
  try {
    const parsed = JSON.parse(e.data);
    self.postMessage({ ok: true, parsed });
  } catch (err) {
    self.postMessage({ ok: false, error: String(err) });
  }
};