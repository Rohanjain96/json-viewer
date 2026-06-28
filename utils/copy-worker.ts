self.onmessage = (e: MessageEvent) => {
  try {
    const str = JSON.stringify(e.data.value, null, e.data.indent ?? 2);
    self.postMessage({ ok: true, str });
  } catch (err) {
    self.postMessage({ ok: false, error: String(err) });
  }
};
