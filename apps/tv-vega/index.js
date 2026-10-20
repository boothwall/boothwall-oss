import { AppRegistry, LogBox } from "react-native";

import { name as appName } from "./app.json";
import { LaunchShell } from "./src/app/LaunchShell";

// Vega runtime noise, not app code. Ignore only these exact messages:
// - LogBox's own overlay uses SafeAreaView, whose native view config Vega lacks.
// - Debug builds warn on every start when no Metro server is attached.
// - A library's forwardRef component declares a third parameter; React only warns about it in
//   dev, and on the TV that warning is a LogBox banner nobody can dismiss with the remote.
LogBox.ignoreLogs([
  "hasViewManagerConfig('RCTSafeAreaView') is not implemented",
  "Running debug build of JavaScript",
  "forwardRef render functions accept exactly two parameters",
]);

AppRegistry.registerComponent(appName, () => LaunchShell);
