import React from "react"
import Editor from '@monaco-editor/react';

const DefaultCode= "#include <bits/stdc++.h> \nusing namespace std; \n \nint main(){\n\n}"

function IDE(){return <Editor height="80vh" width="100%" defaultLanguage="cpp" defaultValue={DefaultCode}/>}

export default IDE
