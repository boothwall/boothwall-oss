import { sourceUrlFor } from "./app.config";

const source = "https://github.com/boothwall/boothwall-oss";

it("uses the deployed web app's short link, and the repo itself for a local web app", () => {
  expect(sourceUrlFor({ web: "https://wall.example.com", source })).toBe(
    "HTTPS://WALL.EXAMPLE.COM/GH",
  );
  expect(sourceUrlFor({ web: "http://192.168.1.20:5173", source })).toBe(source);
});
