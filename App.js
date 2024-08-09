import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import HomeScreen from "./src/screens/HomeScreen";
import DetailScreen from "./src/screens/DetailScreen";
import TaskScreen from "./src/screens/TaskScreen"; // Import your TaskScreen

const navigator = createStackNavigator(
  {
    Home: HomeScreen,
    Detail: DetailScreen,
    Task: TaskScreen, 


  },
  {
    initialRouteName: "Home",
    defaultNavigationOptions: {
      title: "App",
    },
  }
);

export default createAppContainer(navigator);
