import React, { useMemo, useState } from "react";
import parse from "html-react-parser";
import "./styles.css";

const AO3_SKIN = `
#workskin .background {
  width: 1000px;
  margin-left: auto;
  margin-right: auto;
  background: #EEEEEE;
  padding-top: 20px;
  padding-bottom: 20px;
}

#workskin .command {
  text-align: center;
  width: 960px;
  font-weight: bold;
  font-size: 28px;
  font-family: courier new, courier;
  color: #000000;
}

#workskin .text {
  text-align: center;
  width: 960px;
  font-weight: bold;
  font-size: 14px;
  font-family: courier new, courier;
  color: #000000;
}

#workskin .block {
  font-weight: bold;
  font-size: 14px;
  font-family: courier new, courier;
  text-align: left;
  width: 920px;
  margin-left: auto;
  margin-right: auto;
  border: 1px dashed #808080;
  padding-top: 19px;
  padding-bottom: 19px;
  padding-left: 19px;
  padding-right: 19px;
}

#workskin .ampora {
  color: #6A006A;
}

#workskin .calliope {
  color: #929292;
}

#workskin .caliborn {
  color: #323232;
}

#workskin .captor {
  color: #A1A100;
}

#workskin .dad {
  color: #4B4B4B;
}

#workskin .dave {
  color: #E00707;
}

#workskin .dirk {
  color: #F2A400;
}

#workskin .docscratch {
  color: #FFFFFF;
}

#workskin .jade {
  color: #4AC925;
}

#workskin .jake {
  color: #1F9400;
}

#workskin .jane {
  color: #00D5F2;
}

#workskin .jaspersprite {
  color: #F141EF;
}

#workskin .john {
  color: #0715CD;
}

#workskin .kankri {
  color: #FF0000;
}

#workskin .karkat {
  color: #626262;
}

#workskin .leijon {
  color: #416600;
}

#workskin .lordenglish {
  color: #2ED73A;
}

#workskin .makara {
  color: #2B0057;
}

#workskin .maryam {
  color: #008141;
}

#workskin .medigo {
  color: #A10000;
}

#workskin .nitram {
  color: #A15000;
}

#workskin .peixes {
  color: #77003C;
}

#workskin .pyrope {
  color: #008282;
}

#workskin .rose {
  color: #B536DA;
}

#workskin .roxy {
  color: #FF6FF2;
}

#workskin .serket {
  color: #005682;
}

#workskin .zahhak {
  color: #000056;
}
`;

const CHARACTER_MAP = {
  ampora: "#6A006A",
  calliope: "#929292",
  caliborn: "#323232",
  captor: "#A1A100",
  dad: "#4B4B4B",
  dave: "#E00707",
  dirk: "#F2A400",
  docscratch: "#FFFFFF",
  jade: "#4AC925",
  jake: "#1F9400",
  jane: "#00D5F2",
  jaspersprite: "#F141EF",
  john: "#0715CD",
  kankri: "#FF0000",
  karkat: "#626262",
  leijon: "#416600",
  lordenglish: "#2ED73A",
  makara: "#2B0057",
  maryam: "#008141",
  medigo: "#A10000",
  nitram: "#A15000",
  peixes: "#77003C",
  pyrope: "#008282",
  rose: "#B536DA",
  roxy: "#FF6FF2",
  serket: "#005682",
  zahhak: "#000056"
};
const CHARACTER_LIST = Object.entries(CHARACTER_MAP).map(([k, v]) => {
  return [k, v];
});

const REGEX_LIST = [
  [["::$char:", ":::"], "<span class='$<char>'>$<content></span>"]
];

const componentToHex = (c) => {
  const hex = c.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};

const rgbaToHex = (rgba) => {
  const color =
    componentToHex(rgba.r) + componentToHex(rgba.g) + componentToHex(rgba.b);
  return `#${color.toUpperCase()}`;
};

const objectToStyle = (obj) =>
  Object.entries(obj)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")
    .replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);

const arrayToClassList = (arr) => arr.join(" ");

const objectToAttributes = (obj) =>
  Object.entries(obj)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");

const colorToCSS = (color) => {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
};

const element = (type, attrs, content, { chars, regexes }) => {
  //console.log("el", type, attrs, content);
  // convert known colors to characters
  let known_character;
  if (attrs.style?.color) {
    const hex_color = rgbaToHex(attrs.style.color);
    known_character = chars
      .filter(([char, color]) => {
        return color === hex_color;
      })
      .at(0);
  }
  if (known_character) {
    attrs.class.push(known_character[0]);
  }
  // normalize color
  if (known_character) {
    delete attrs.style.color;
  } else if (attrs.style?.color?.hex) {
    // hex color
    attrs.style.color = attrs.style.color.hex;
  } else if (attrs.style?.color) {
    // rgba color
    attrs.style.color = colorToCSS(attrs.style.color);
  }
  // convert special attrs
  attrs.style = objectToStyle(attrs.style || {});
  attrs.class = arrayToClassList(attrs.class || []);
  // final
  return `<${type} ${objectToAttributes(attrs)}>${content}</${type}>`;
};

const paragraph = (style = {}, classes = [], content, { chars, regexes }) => {
  return element(
    "p",
    {
      style,
      class: classes
    },
    content,
    { chars, regexes }
  );
};

const span = (style = {}, classes = [], content, { chars, regexes }) => {
  return element(
    "span",
    {
      style,
      class: classes
    },
    content,
    { chars, regexes }
  );
};

const normalizeRegex = ([[start, end], target]) => {
  return [
    [
      start.replace(/^(.+)/, "($1").replace(/\$([a-z]+)/, "(?<$1>[a-z]+)"),
      "(?<content>.+)",
      end.replace(/(.+)$/, "$1)")
    ].join(""),
    target
  ];
};

const runRegexes = (str, regexes) => {
  return regexes.reduce((final, regex) => {
    const [replace_this, with_that] = normalizeRegex(regex);
    return final.replace(new RegExp(replace_this, "g"), with_that);
  }, str);
};

const pestergenPartToAo3 = (part, chars, regexes) => {
  // run regexes on part
  part.line = runRegexes(part.line, regexes);
  switch (part.interventionType) {
    case "narrator":
      return paragraph({ color: part.color }, ["text"], part.line, {
        chars,
        regexes
      });
    case "character":
      return span({ color: part.color }, [], part.line, { chars, regexes });
    default:
      return false;
  }
};

const groupBlocks = (parts) => {
  return parts.reduce((final, next) => {
    console.log("reducing", final, next);
    if (next.interventionType === "character") {
      if (!Array.isArray(final[final.length - 1])) {
        return [...final, [next]];
      } else {
        return [...final.slice(0, -1), [...final[final.length - 1], next]];
      }
    } else {
      return [...final, next];
    }
  }, []);
};

const interventionBlock = (block, chars, regexes) => {
  return element(
    "p",
    {
      class: ["block"]
    },
    block.map((line) => pestergenPartToAo3(line, chars, regexes)).join("<br/>"),
    { chars, regexes }
  );
};

const pestergenToAo3 = (parts, chars, regexes) => {
  if (typeof parts === "string") return parts;
  const grouped_parts = groupBlocks(parts);
  return grouped_parts
    .map((block) => {
      return block.interventionType === "narrator"
        ? pestergenPartToAo3(block, chars, regexes)
        : interventionBlock(block, chars, regexes);
    })
    .join("\n");
};

const workskin = (str) => {
  return `<style>${AO3_SKIN}</style>` + `<div id="workskin">${str}</div>`;
};

const CharacterManager = ({ list, setList }) => {
  return (
    <div id="character-manager">
      {list.map(([char, color], index) => {
        return (
          <>
            <input
              value={char}
              onChange={(e) => {
                setList(list.toSpliced(index, 1, [e.target.value, color]));
              }}
            />
            <input
              value={color}
              onChange={(e) => {
                setList(list.toSpliced(index, 1, [char, e.target.value]));
              }}
            />
            <br />
          </>
        );
      })}
      <br />
      <button
        onClick={() => {
          setList([...list, ["", ""]]);
        }}
      >
        New
      </button>
      <button
        onClick={() => {
          setList(list.slice(0, -1));
        }}
      >
        Delete
      </button>
    </div>
  );
};

const RegexManager = ({ list, setList }) => {
  return (
    <div id="character-manager">
      {list.map(([[start, end], target], index) => {
        return (
          <>
            <input
              value={start}
              onChange={(e) => {
                setList(
                  list.toSpliced(index, 1, [[e.target.value, end], target])
                );
              }}
            />
            <input
              value={end}
              onChange={(e) => {
                setList(
                  list.toSpliced(index, 1, [[start, e.target.value], target])
                );
              }}
            />
            <input
              value={target}
              onChange={(e) => {
                setList(
                  list.toSpliced(index, 1, [[start, end], e.target.value])
                );
              }}
            />
            <br />
          </>
        );
      })}
      <br />
      <button
        onClick={() => {
          setList([...list, ["", ""]]);
        }}
      >
        New
      </button>
      <button
        onClick={() => {
          setList(list.slice(0, -1));
        }}
      >
        Delete
      </button>
    </div>
  );
};

const TextBox = ({ value, setValue }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={{
        width: "100%",
        minHeight: "15em"
      }}
    />
  );
};

export default function App() {
  const [input, setInput] = useState("");
  const [chars, setChars] = useState(CHARACTER_LIST);
  const [regexes, setRegexes] = useState(REGEX_LIST);

  const log = useMemo(() => {
    try {
      return JSON.parse(input);
    } catch (e) {
      return String(e);
    }
  }, [input]);
  const final = useMemo(() => {
    return pestergenToAo3(log, chars, regexes);
  }, [log, chars, regexes]);
  return (
    <div className="App">
      <h1>Pestergen to AO3</h1>
      <p>
        This tool lets you create Pesterlogs with{" "}
        <a href="https://pestergen.herokuapp.com">Pestergen</a>, export them and
        transform them to{" "}
        <a href="https://archiveofourown.org/works/1159609?view_full_work=true">
          AO3 Homestuck Skin
        </a>{" "}
        logs.
      </p>
      <h3>Pestergen JSON Export</h3>
      <TextBox value={input} setValue={setInput} />
      <h3>AO3 Homestuck Theme Output</h3>
      <TextBox value={final} />
      {parse(workskin(final))}
      <h3>Config</h3>
      <h4>Characters</h4>
      <CharacterManager list={chars} setList={setChars} />
      <h4>Regex</h4>
      <RegexManager list={regexes} setList={setRegexes} />
    </div>
  );
}
