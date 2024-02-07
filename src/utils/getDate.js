export const fetchDate = async () => {
  return await fetch("http://worldtimeapi.org/api/timezone/Asia/Kolkata")
    .then(async (response) => {
      const res = await response.json();
      return new Date(res.datetime);
      // return res;
    })
    .catch((error) => {
      console.log("Error: ", error);
      return new Date();
    });
//   console.log("data", data, new Promise((data)));
//   return new Date(Promise.resolve(data));
};
