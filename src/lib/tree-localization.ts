import FallbackLanguage from "@/../messages/en.json";
import * as fs from "fs";
import * as path from "path";

export function localizePageTree(tree: any, lang: string): any {
  // Load the language file
  let translations: any = FallbackLanguage;

  console.log("Loading translations for lang:", lang);

  if (lang !== "en") {
    const langFilePath = path.join(process.cwd(), "messages", `${lang}.json`);
    if (fs.existsSync(langFilePath)) {
      translations = JSON.parse(fs.readFileSync(langFilePath, "utf-8"));
    } else {
      console.warn(
        `Translation file for language '${lang}' not found. Falling back to English.`,
      );
    }
  }

  // Helper function to get translation from nested object using dot notation
  function getTranslation(key: string): string {
    const parts = key.split(".");
    let value: any = translations;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        // Fall back to English if translation not found
        value = FallbackLanguage;
        for (const fallbackPart of parts) {
          if (value && typeof value === "object" && fallbackPart in value) {
            value = value[fallbackPart];
          } else {
            return key; // Return the key itself if not found in fallback
          }
        }
        break;
      }
    }

    return typeof value === "string" ? value : key;
  }

  // Helper function to translate a string if it's wrapped in {}
  function translateString(text: string): string {
    if (!text || typeof text !== "string") return text;

    const match = text.match(/^\{(.+)\}$/);
    if (match) {
      return getTranslation(match[1]);
    }
    return text;
  }

  // Recursively traverse and translate the tree
  function traverseNode(node: any): any {
    if (!node) return node;

    // Clone the node to avoid mutating the original
    const clonedNode = { ...node };

    // Translate properties that might contain translation keys
    if (clonedNode.name) {
      clonedNode.name = translateString(clonedNode.name);
    }

    if (clonedNode.title) {
      clonedNode.title = translateString(clonedNode.title);
    }

    // Handle index property (for folders with index pages)
    if (clonedNode.index && typeof clonedNode.index === "object") {
      clonedNode.index = traverseNode(clonedNode.index);
    }

    // Recursively handle children
    if (Array.isArray(clonedNode.children)) {
      clonedNode.children = clonedNode.children.map(traverseNode);
    }

    return clonedNode;
  }

  return traverseNode(tree);
}
