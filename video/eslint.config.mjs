import { config } from "@remotion/eslint-config-flat";

export default [...config, {files:['src/**/*.jsx'],rules:{'react/prop-types':'off'}}];
