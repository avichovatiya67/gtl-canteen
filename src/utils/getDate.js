const apiUrl = process.env.REACT_APP_GET_TIME_API_URL;
export const fetchDate = async () => {
  return await fetch(apiUrl)
    .then(async (response) => {
      const res = await response.json();
      return new Date(res.datetime);
      // return res;
    })
    .catch((error) => {
      console.log("Error: ", error);
      return new Date();
    });
};

export const getDDMMYYYY = (date) => {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
