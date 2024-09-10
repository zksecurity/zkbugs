import commonJS from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import thread from "./src/threadman_thread.js";

export default [
    {
        input: "main.js",
        output: [
            {
                format: "es",
                file: "build/browser.esm.js",
            },
        ],
        plugins: [
            replace({
                preventAssignment: true,
                changed: "replaced",
                delimiters: ["", ""],
                /*
                * The following variable replaces to true in the build in the similar way as snarkjs does.
                * https://github.com/iden3/snarkjs/blob/ef9042451f98f254b520b8ce9b9544a849e90a5d/config/rollup.iife.config.js
                */
                "process.browser": true,
                "import Worker from \"web-worker\"": "",
                /* 
            Because of some frontend frameworks uses monkey patching to track UI changes or other purposes (including Angular, AngularJS, Ember.js, JQuery...), it's important to make sure that the thread function is not modified by the framework and passing in the web worker as it is.
        */
                "thread.toString()": JSON.stringify(thread.toString()),
            }),
            commonJS(),
            nodeResolve({
                browser: true,
            }),
        ],
        treeshake: {
            // remove unused imports from the build
            preset: "smallest",
        },
    },
];
