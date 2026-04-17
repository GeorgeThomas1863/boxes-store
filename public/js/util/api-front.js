export const sendToBack = async (inputParams, method = "POST") => {
  const { route } = inputParams;

  try {
    const params = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (method !== "GET" && method !== "HEAD") {
      params.body = JSON.stringify(inputParams);
    }

    const res = await fetch(route, params);
    if (!res || !res.ok) return null;

    const data = await res.json();

    return data;
  } catch (error) {
    return null;
  }
};

export const sendToBackFile = async (inputParams) => {
  const { route, formData } = inputParams;

  try {
    const res = await fetch(route, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data;
  } catch (e) {
    return null;
  }
};
