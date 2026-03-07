import { execSync } from "child_process";
import { test } from "vitest";

test("restore images", () => {
  try {
    // We only want to restore the specific files we ruined
    const files = [
      "cat-lv0.png", "cat-lv1.png", "cat-lv2.png", "cat-lv3.png", "cat-lv4.png", "cat-lv5.png", "cat-lv6.png",
      "cat-scholar-lv0.png", "cat-scholar-lv1.png", "cat-scholar-lv2.png", "cat-scholar-lv3.png", "cat-scholar-lv4.png", "cat-scholar-lv5.png", "cat-scholar-lv6.png",
      "cat-sport-lv0.png", "cat-sport-lv1.png", "cat-sport-lv2.png", "cat-sport-lv3.png", "cat-sport-lv4.png", "cat-sport-lv5.png", "cat-sport-lv6.png"
    ];
    
    files.forEach(f => {
      try {
        execSync(`git checkout -- src/assets/${f}`);
        console.log(`Restored ${f}`);
      } catch (e) {
        console.log(`Could not restore ${f}`);
      }
    });
  } catch (e) {
    console.error(e);
  }
});
