/**  INWIZ_UniversalHive_30p.jsx
 *   Universal ONE-MASTER builder for multi-template brochures (up to 30 pages)
 *   InDesign CC 2022–2025 (Win/Mac)
 *   -------------------------------------------------------------------------
 *   WHAT IT DOES
 *   - Select multiple .indd / pick a folder / or use OPEN documents
 *   - Reads labels from Text/Graphic/Table frames & Groups (masters optional)
 *   - Robust NORMALIZER: fuzzy synonyms + regex heuristics for unknown tag names
 *   - Auto-buckets tags into a CANONICAL PLAN (P001–P030) that you control
 *   - De-dupes & ranks conflicts; emits ONE Word-friendly .doc with bracket-tags
 *   - Also writes a CSV row-per-tag for audit/edit
 *   - Optional synonym override file “TagMap.csv” (drag next to script)
 *
 *   DESIGNED FOR:
 *   - 8pp, 12pp, 16pp, 24pp, 30pp brochures with different tag naming schemes
 *   - Mixed vocabularies (e.g., HEADING, Title, H1, Heading1, MainHead…)
 *   - Maps, site plans, floorplans, pointers, stats, specs, contacts, about…
 *
 *   SAFE BY DEFAULT:
 *   - No destructive edits to your documents. Opens/reads/Closes (No Save)
 *   - Ignores unlabeled objects
 *
 *   -------------------------------------------------------------------------
 *   SETUP QUICK-START:
 *   1) Window > Utilities > Scripts → Right-click User → Reveal in Finder/Explorer
 *   2) Drop this file there: INWIZ_UniversalHive_30p.jsx
 *   3) Double-click it in Scripts panel.
 *   4) Pick templates or a folder, choose output .doc location. CSV auto-writes.
 *   -------------------------------------------------------------------------
 */

(function () {

  // ========================= SETTINGS =========================
  var S = {
    INCLUDE_MASTER_ITEMS : false,   // include labeled master items
    ACCEPT_GROUPS        : true,    // infer TEXT/IMAGE from group content
    ACCEPT_GRAPHICS      : true,    // rectangles/ovals/polygons -> IMAGE
    ACCEPT_TABLES        : true,    // text frames with tables count as TEXT
    WRITE_CSV            : true,    // export CSV next to .doc
    KEEP_ORIGINAL_IDS    : false,   // true=keep exact label IDs, false=canonicalize
    IMAGE_PATH_PLACEHOLDER : "/full/path/to/image.jpg",
    // If true and “TagMap.csv” exists next to the script, synonyms are loaded/merged
    LOAD_TAGMAP_FROM_CSV : true
  };

  // Canonical PAGE PLAN (up to 30 pages). You can edit freely.
  // Slot names are normalized KINDS (not original labels). Use :IMAGE to force image slots.
  var PAGE_PLAN = {
    P001: ["HEADING","SUB_HEADING","ADDRESS","CONTACT","BUILDING_AREA_TEXT","LIC_NO"],
    P002: ["HEADING","BODY","POINTER","PROPERTY_NAME","STATS_TEXT","LIST"],
    P003: ["SITE_PLAN:IMAGE","HEADING","BODY","TABLE1","TABLE2"],
    P004: ["MAP_INGRESS:IMAGE","HEADING","BODY","LIST"],
    P005: ["MAP_SUB_MARKET:IMAGE","HEADING","STATS_TEXT","POINTER","BODY"],
    P006: ["MAP_AMENITIES:IMAGE","HEADING","BODY","LIST"],
    P007: ["FLOORPLAN1:IMAGE","HEADING","BODY","TABLE3"],
    P008: ["MAP1:IMAGE","HEADING","BODY","ABOUT_JLL","CONTACT"],
    P009: ["HEADING","BODY","LIST","STATS_TEXT","POINTER"],
    P010: ["HEADING","BODY","LIST","TABLE1"],
    P011: ["FLOORPLAN2:IMAGE","HEADING","BODY"],
    P012: ["HEADING","BODY","LIST","TABLE2"],
    P013: ["HEADING","BODY","LIST"],
    P014: ["HEADING","BODY","LIST","TABLE3"],
    P015: ["HEADING","BODY","LIST"],
    P016: ["FLOORPLAN3:IMAGE","HEADING","BODY"],
    P017: ["MAP2:IMAGE","HEADING","BODY"],
    P018: ["HEADING","BODY","LIST"],
    P019: ["HEADING","BODY","LIST","STATS_TEXT"],
    P020: ["HEADING","BODY","LIST"],
    P021: ["HEADING","BODY","LIST"],
    P022: ["HEADING","BODY","LIST","TABLE1","TABLE2"],
    P023: ["HEADING","BODY","LIST"],
    P024: ["HEADING","BODY","LIST"],
    P025: ["HEADING","BODY","LIST","POINTER"],
    P026: ["HEADING","BODY","LIST"],
    P027: ["HEADING","BODY","LIST"],
    P028: ["HEADING","BODY","LIST"],
    P029: ["HEADING","BODY","LIST","STATS_TEXT"],
    P030: ["HEADING","CONTACT1","CONTACT2","CONTACT3","CONTACT_US","ABOUT_JLL"]
  };

  // ================== SYNONYM / NORMALIZER TABLE ==================
  // Left: lowercase substring or regex-test; Right: canonical KIND to map to.
  // This is additive with TagMap.csv if present.
  var KIND_SYNONYMS = {
    // Headings
    "heading_sub_heading"  : "HEADING",
    "mainhead"             : "HEADING",
    "main_heading"         : "HEADING",
    "title"                : "HEADING",
    "h1"                   : "HEADING",
    "h2"                   : "HEADING",
    "heading"              : "HEADING",
    "subhead"              : "SUB_HEADING",
    "sub_heading"          : "SUB_HEADING",
    "sub-title"            : "SUB_HEADING",
    // Body / list / tables
    "body"                 : "BODY",
    "para"                 : "BODY",
    "text"                 : "BODY",
    "copy"                 : "BODY",
    "list"                 : "LIST",
    "bullet"               : "LIST",
    "table_3"              : "TABLE3",
    "table3"               : "TABLE3",
    "table2"               : "TABLE2",
    "table1"               : "TABLE1",
    "table"                : "TABLE1",
    // Property / specs / stats / pointers
    "property_name"        : "PROPERTY_NAME",
    "property"             : "PROPERTY_NAME",
    "spec_title"           : "HEADING",
    "property_spec"        : "HEADING",
    "spec_"                : "HEADING",
    "stats_text"           : "STATS_TEXT",
    "stat"                 : "STATS_TEXT",
    "pointer"              : "POINTER",
    // Contact / address / about
    "address"              : "ADDRESS",
    "contact_us"           : "CONTACT_US",
    "contact1"             : "CONTACT1",
    "contact2"             : "CONTACT2",
    "contact3"             : "CONTACT3",
    "contact"              : "CONTACT",
    "about_jll"            : "ABOUT_JLL",
    // License / area
    "lic_no"               : "LIC_NO",
    "building_area_text"   : "BUILDING_AREA_TEXT",
    // Maps / floorplans / site plans
    "site_plan"            : "SITE_PLAN",
    "map_ingress"          : "MAP_INGRESS",
    "map_sub_market"       : "MAP_SUB_MARKET",
    "map_amenities"        : "MAP_AMENITIES",
    "map_demo"             : "MAP1",
    "map1"                 : "MAP1",
    "map2"                 : "MAP2",
    "floorplan3"           : "FLOORPLAN3",
    "floorplan2"           : "FLOORPLAN2",
    "floorplan1"           : "FLOORPLAN1",
    "floor"                : "FLOORPLAN1",
    // Fallbacks
    "img"                  : "IMAGE",
    "graphic"              : "IMAGE",
    "pic"                  : "IMAGE"
  };

  // ========================= INPUT PICK =========================
  var files = pickManyINDD();
  if (!files) {
    var folder = Folder.selectDialog("Pick a folder with .indd/.indt (Cancel = use OPEN docs)");
    if (folder) files = listINDDInFolder(folder, true);
    else if (hasDocs()) files = "__OPEN__";
    else { alert("No files chosen and no documents open."); return; }
  }

  // Optionally extend synonyms from TagMap.csv
  if (S.LOAD_TAGMAP_FROM_CSV) {
    try { mergeTagMapCSV(KIND_SYNONYMS); } catch(e) {/* ignore */}
  }

  // ========================= COLLECT =========================
  var items = [];
  if (files === "__OPEN__") {
    for (var d=0; d<app.documents.length; d++) {
      items = items.concat(collectFromDoc(app.documents[d], S));
    }
  } else {
    for (var f=0; f<files.length; f++){
      var doc = null;
      try {
        doc = app.open(files[f], false);
        items = items.concat(collectFromDoc(doc, S));
      } catch(e) {
        // continue
      } finally {
        try { if (doc) doc.close(SaveOptions.no); } catch(e){}
      }
    }
  }
  if (!items.length) { alert("No labeled items found."); return; }

  // ===================== NORMALIZE & DEDUPE =====================
  // item: {srcDoc, pageLabel, pageNum, tagId, type, isImage, weight, kind}
  var u = {}, merged = [];
  for (var i=0; i<items.length; i++){
    var it = items[i];
    var key = it.tagId + "@" + it.srcDoc + "@" + it.pageLabel;
    if (!u[key]) { u[key] = true; merged.push(it); }
  }

  // ===================== BUCKET into PLAN (P001–P030) =====================
  var buckets = makeBuckets(PAGE_PLAN);
  for (var j=0; j<merged.length; j++){
    var m = merged[j];
    var k = deriveKind(m.tagId, m.type, m.isImage, KIND_SYNONYMS);
    m.kind = k;
    placeIntoBuckets(buckets, k, m, PAGE_PLAN);
  }

  // ===================== OUTPUT ONE .DOC (+ CSV) =====================
  var outDoc = File.saveDialog("Save ONE Master Word (.doc)", "*.doc");
  if (!outDoc) return;

  var outTxt = [];
  outTxt.push("INWIZ Master Word (UltraDetect Clean) — ONE MASTER (up to 30 Pages)");
  outTxt.push("How to fill");
  outTxt.push("(1) Type your text ONLY between the two bracket lines.");
  outTxt.push("(2) For images, paste the FULL file path between the bracket lines.");
  outTxt.push("(3) Do not delete the bracket lines.");
  outTxt.push("(4) Unified pages P001–P0XX; tags deduped + normalized.\r\n");

  var planKeys = sortPages(Object.keys(PAGE_PLAN)); // P001..P030
  for (var pk=0; pk<planKeys.length; pk++){
    var P = planKeys[pk];
    var slotDefs = PAGE_PLAN[P];
    outTxt.push("Page " + P + " ----------------------------------------");
    for (var s=0; s<slotDefs.length; s++){
      var slot = slotDefs[s];                 // e.g., "HEADING" or "SITE_PLAN:IMAGE"
      var parts = slot.split(":");
      var name = parts[0];
      var forceImage = (parts[1] && parts[1].toUpperCase() === "IMAGE");
      var arr = buckets[P][name] || [];

      if (arr.length === 0) {
        var tagId0 = makeTagId(P, name, (s+1), S.KEEP_ORIGINAL_IDS);
        outTxt.push("[" + tagId0 + "]  " + (forceImage ? "IMAGE" : "TEXT") + "   Page: " + stripP(P) + " here...");
        if (forceImage) outTxt.push(S.IMAGE_PATH_PLACEHOLDER);
        outTxt.push("[/" + tagId0 + "]\r\n");
      } else {
        for (var r=0; r<arr.length; r++){
          var it2 = arr[r];
          var tagOut = S.KEEP_ORIGINAL_IDS ? it2.tagId : makeTagId(P, name, (r+1), false);
          var isImg  = it2.isImage || forceImage;
          outTxt.push("[" + tagOut + "]  " + (isImg ? "IMAGE" : "TEXT") + "   Page: " + stripP(P) + " here...");
          if (isImg) outTxt.push(S.IMAGE_PATH_PLACEHOLDER);
          outTxt.push("[/" + tagOut + "]\r\n");
        }
      }
    }
    outTxt.push("");
  }

  writeText(outDoc, outTxt.join("\r\n"));

  if (S.WRITE_CSV) {
    var csv = File(outDoc.fsName.replace(/\.doc$/i, "_Rows.csv"));
    var rows = ["Page,TagID,Kind,Type,SourceDoc,SourcePage"];
    for (var pk2=0; pk2<planKeys.length; pk2++){
      var P2 = planKeys[pk2];
      var slotDefs2 = PAGE_PLAN[P2];
      for (var s2=0; s2<slotDefs2.length; s2++){
        var slot2 = slotDefs2[s2].split(":")[0];
        var arr2 = buckets[P2][slot2] || [];
        if (!arr2.length) {
          var tag0 = makeTagId(P2, slot2, (s2+1), S.KEEP_ORIGINAL_IDS);
          rows.push([P2, tag0, slot2, guessTypeFromSlot(slot2), "", ""].join(","));
        } else {
          for (var z=0; z<arr2.length; z++){
            var it3 = arr2[z];
            var id3 = S.KEEP_ORIGINAL_IDS ? it3.tagId : makeTagId(P2, slot2, (z+1), false);
            rows.push([P2, id3, slot2, (it3.isImage?"IMAGE":"TEXT"), safeCsv(it3.srcDoc), it3.pageLabel].join(","));
          }
        }
      }
    }
    writeText(csv, rows.join("\r\n"));
  }

  alert("Universal ONE Master built:\n" + outDoc.fsName + (S.WRITE_CSV ? "\nCSV also exported." : ""));


  // ============================= HELPERS =============================
  function collectFromDoc(doc, S) {
    var arr = [];
    var targets = [];
    for (var p=0; p<doc.pages.length; p++) targets.push(doc.pages[p]);
    if (S.INCLUDE_MASTER_ITEMS) {
      for (var m=0; m<doc.masterSpreads.length; m++) targets.push(doc.masterSpreads[m]);
    }

    for (var t=0; t<targets.length; t++){
      var c = targets[t];
      var pageLabel = (c instanceof Page) ? ("P" + z3(c.documentOffset+1)) : "MASTER";
      var pageNum = (c instanceof Page) ? (c.documentOffset+1) : 0;
      var all = c.allPageItems;

      for (var i=0; i<all.length; i++){
        var it = all[i];
        try {
          var tag = (it.label || "").toString();
          if (!tag) continue;

          var rec = null;

          if (S.ACCEPT_GROUPS && it instanceof Group) {
            rec = classifyGroup(it, tag);
          } else if (it instanceof TextFrame) {
            rec = { tagId: tag, type: "TEXT", isImage: false };
          } else if (S.ACCEPT_GRAPHICS && (it instanceof Rectangle || it instanceof Polygon || it instanceof Oval)) {
            rec = { tagId: tag, type: "IMAGE", isImage: true };
          }

          if (rec) {
            rec.srcDoc = doc.name;
            rec.pageLabel = pageLabel;
            rec.pageNum = pageNum;
            rec.weight = scoreTag(tag); // quality score for conflict resolution
            arr.push(rec);
          }
        } catch(e){/*skip*/}
      }
    }
    return arr;
  }

  function classifyGroup(g, tag) {
    var txt = g.textFrames.length > 0;
    var gfx = (g.rectangles.length + g.ovals.length + g.polygons.length) > 0;
    if (txt) return { tagId: tag, type: "TEXT", isImage: false };
    if (gfx) return { tagId: tag, type: "IMAGE", isImage: true };
    return null;
  }

  // Weight better-structured tags higher (e.g., P###-KIND-###)
  function scoreTag(tag) {
    var s = 0, t = (tag||"");
    if (/^P\d{3}-/.test(t)) s += 5;
    if (/-\d{3}$/.test(t)) s += 3;
    if (t.indexOf("_")>=0) s += 1;
    if (t.length <= 36) s += 1;
    return s;
  }

  function deriveKind(tagId, type, isImage, map) {
    if (isImage || type === "IMAGE") {
      var tid = (tagId||"").toLowerCase();
      // image-first aliases
      if (containsAny(tid, ["site_plan"])) return "SITE_PLAN";
      if (containsAny(tid, ["map_ingress"])) return "MAP_INGRESS";
      if (containsAny(tid, ["map_sub_market"])) return "MAP_SUB_MARKET";
      if (containsAny(tid, ["map_amenities"])) return "MAP_AMENITIES";
      if (containsAny(tid, ["floorplan3"])) return "FLOORPLAN3";
      if (containsAny(tid, ["floorplan2"])) return "FLOORPLAN2";
      if (containsAny(tid, ["floorplan1","floor"])) return "FLOORPLAN1";
      if (containsAny(tid, ["map2"])) return "MAP2";
      if (containsAny(tid, ["map1","map_demo","map"])) return "MAP1";
      return "IMAGE";
    }

    var low = (tagId||"").toLowerCase();
    // exact/substring against known map
    for (var k in map) if (map.hasOwnProperty(k)){
      if (low.indexOf(k) >= 0) return map[k];
    }

    // basic heuristics
    if (/\b(contact[_\- ]?us)\b/.test(low)) return "CONTACT_US";
    if (/^contact1\b/.test(low)) return "CONTACT1";
    if (/^contact2\b/.test(low)) return "CONTACT2";
    if (/^contact3\b/.test(low)) return "CONTACT3";
    if (/^contact/.test(low))   return "CONTACT";
    if (/\babout[_\- ]?jll\b/.test(low)) return "ABOUT_JLL";
    if (/\baddress\b/.test(low)) return "ADDRESS";
    if (/\blic[_\- ]?no\b/.test(low)) return "LIC_NO";
    if (/\bbuilding[_\- ]?area/.test(low)) return "BUILDING_AREA_TEXT";
    if (/\b(property[_\- ]?name|propname)\b/.test(low)) return "PROPERTY_NAME";
    if (/\b(pointer|callout)\b/.test(low)) return "POINTER";
    if (/\b(stat|kpi|metric)\b/.test(low)) return "STATS_TEXT";
    if (/\b(list|bullet|ul|ol)\b/.test(low)) return "LIST";
    if (/\b(table)\b/.test(low)) return "TABLE1";
    if (/\b(heading|title|h1|h2)\b/.test(low)) return "HEADING";
    if (/\b(sub[_\- ]?head)/.test(low)) return "SUB_HEADING";
    if (/\b(body|para|copy|text)\b/.test(low)) return "BODY";
    return "BODY";
  }

  function makeBuckets(plan) {
    var b = {};
    for (var P in plan) if (plan.hasOwnProperty(P)) {
      b[P] = {};
      var slots = plan[P];
      for (var i=0; i<slots.length; i++){
        var nm = slots[i].split(":")[0];
        b[P][nm] = [];
      }
    }
    return b;
  }

  function placeIntoBuckets(buckets, kind, item, plan) {
    // Heuristic routing: cover-ish to early pages, images to map/floor pages, contacts to last page, else spread.
    var P = guessPageForKind(kind, plan);
    // If page lacks the slot, try first page that has it.
    if (!buckets[P] || !buckets[P][kind]) P = firstPageWithKind(buckets, kind) || P;
    // Conflict resolution: keep list sorted by weight descending.
    buckets[P][kind].push(item);
    buckets[P][kind].sort(function(a,b){ return b.weight - a.weight; });
  }

  function guessPageForKind(kind, plan) {
    switch(kind){
      case "HEADING":
      case "SUB_HEADING":
      case "ADDRESS":
      case "CONTACT":
      case "BUILDING_AREA_TEXT":
      case "LIC_NO":
        return "P001";
      case "SITE_PLAN":
      case "TABLE1":
      case "TABLE2":
        return "P003";
      case "MAP_INGRESS":       return "P004";
      case "MAP_SUB_MARKET":    return "P005";
      case "MAP_AMENITIES":     return "P006";
      case "FLOORPLAN3":        return "P016";
      case "FLOORPLAN2":        return "P011";
      case "FLOORPLAN1":        return "P007";
      case "MAP2":              return "P017";
      case "MAP1":              return "P008";
      case "TABLE3":            return "P007";
      case "CONTACT1":
      case "CONTACT2":
      case "CONTACT3":
      case "CONTACT_US":
      case "ABOUT_JLL":
        return "P030";
      case "STATS_TEXT":
      case "POINTER":
      case "LIST":
      case "BODY":
      default:
        // mid body pages
        return "P009";
    }
  }

  function firstPageWithKind(buckets, kind) {
    var keys = sortPages(Object.keys(buckets));
    for (var i=0; i<keys.length; i++){
      var P = keys[i];
      if (buckets[P].hasOwnProperty(kind)) return P;
    }
    return keys[0];
  }

  function makeTagId(P, name, idx1, keepOriginal) {
    var n = ("000" + idx1).slice(-3);
    return P + "-" + name + "-" + n;
  }

  function guessTypeFromSlot(slot) {
    return (/_PLAN|^MAP|FLOORPLAN/i.test(slot) ? "IMAGE" : "TEXT");
  }

  // ------------- File helpers -------------
  function pickManyINDD() {
    if ($.os.toLowerCase().indexOf("mac")>=0) { try{ app.activate(); }catch(e){} }
    var f = File.openDialog("Select one or more InDesign templates", "*.indd;*.indt", true);
    return f && f.length ? f : null;
  }

  function listINDDInFolder(root, recurse) {
    var out = [];
    var entries = root.getFiles();
    for (var i=0; i<entries.length; i++){
      var it = entries[i];
      if (it instanceof File && /\.(indd|indt)$/i.test(it.name)) out.push(it);
      else if (recurse && it instanceof Folder) out = out.concat(listINDDInFolder(it, true));
    }
    return out;
  }

  function hasDocs(){ return app.documents.length > 0; }

  function writeText(fileObj, text){
    fileObj.encoding = "UTF-8";
    fileObj.lineFeed = "Windows"; // Word-friendly
    fileObj.open("w");
    fileObj.write(text);
    fileObj.close();
  }

  function sortPages(keys){
    return keys.sort(function(a,b){
      return parseInt(a.replace(/[^\d]/g,"")||"0",10) - parseInt(b.replace(/[^\d]/g,"")||"0",10);
    });
  }

  function stripP(P){ return String(parseInt(P.replace(/[^\d]/g,"")||"0",10)); }

  function z3(n){ n=+n; return (n<10?"00":(n<100?"0":"")) + n; }

  function containsAny(s, arr){
    for (var i=0; i<arr.length; i++){ if (s.indexOf(arr[i])>=0) return true; }
    return false;
  }

  function safeCsv(s){
    if (!s) return "";
    s = String(s);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  }

  // Optional synonyms loader: TagMap.csv next to script
  // CSV format: pattern,kind
  // Example:
  //   title,HEADING
  //   main_title,HEADING
  function mergeTagMapCSV(mapObj){
    var scriptFile = File($.fileName);
    var folder = scriptFile.parent;
    var csv = File(folder.fsName + "/TagMap.csv");
    if (!csv.exists) return;
    csv.open("r");
    csv.encoding = "UTF-8";
    var txt = csv.read();
    csv.close();
    var lines = txt.split(/\r?\n/);
    for (var i=0; i<lines.length; i++){
      var line = lines[i].trim();
      if (!line || line.charAt(0)==="#") continue;
      var parts = line.split(",");
      if (parts.length >= 2) {
        var pat = parts[0].trim().toLowerCase();
        var kind= parts[1].trim().toUpperCase();
        if (pat && kind) mapObj[pat] = kind;
      }
    }
  }

})();