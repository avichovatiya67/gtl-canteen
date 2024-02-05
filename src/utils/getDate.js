export const fetchDate = async () => {
  const data = await fetch("http://worldtimeapi.org/api/timezone/Asia/Kolkata")
    .then(async (response) => {
      const res = await response.json();
      return res.datetime;
      // return res;
    })
    .catch((error) => {
      console.log("Error: ", error);
      return new Date();
    });
  return new Date(data);
};
