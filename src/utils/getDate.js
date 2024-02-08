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
