import { describe, expect, it } from "vitest";
import { encodeValue, methodCall, parseResponse } from "../../src/sources/xmlrpc.ts";

describe("encodeValue", () => {
  it("strings are XML-escaped", () => {
    expect(encodeValue("a&b<c")).toBe("<value><string>a&amp;b&lt;c</string></value>");
  });

  it("integers use <int>", () => {
    expect(encodeValue(42)).toBe("<value><int>42</int></value>");
  });

  it("floats use <double>", () => {
    expect(encodeValue(3.14)).toBe("<value><double>3.14</double></value>");
  });

  it("booleans use <boolean>", () => {
    expect(encodeValue(true)).toBe("<value><boolean>1</boolean></value>");
    expect(encodeValue(false)).toBe("<value><boolean>0</boolean></value>");
  });

  it("null and undefined become <nil/>", () => {
    expect(encodeValue(null)).toBe("<value><nil/></value>");
    expect(encodeValue(undefined)).toBe("<value><nil/></value>");
  });

  it("arrays nest values", () => {
    expect(encodeValue([1, "a"])).toBe(
      "<value><array><data><value><int>1</int></value><value><string>a</string></value></data></array></value>",
    );
  });

  it("structs serialise members", () => {
    expect(encodeValue({ k: "v" })).toBe(
      "<value><struct><member><name>k</name><value><string>v</string></value></member></struct></value>",
    );
  });
});

describe("methodCall", () => {
  it("wraps params in a methodCall envelope", () => {
    const xml = methodCall("test", [1, "a"]);
    expect(xml).toContain('<?xml version="1.0"?>');
    expect(xml).toContain("<methodName>test</methodName>");
    expect(xml).toContain("<int>1</int>");
    expect(xml).toContain("<string>a</string>");
  });
});

describe("parseResponse", () => {
  it("parses an int param", () => {
    const xml = `<?xml version="1.0"?><methodResponse><params><param><value><int>7</int></value></param></params></methodResponse>`;
    expect(parseResponse(xml)).toBe(7);
  });

  it("parses an array of structs (typical Odoo `read` response)", () => {
    const xml = `<?xml version="1.0"?>
      <methodResponse>
        <params>
          <param>
            <value><array><data>
              <value><struct>
                <member><name>id</name><value><int>1</int></value></member>
                <member><name>name</name><value><string>Order #1</string></value></member>
              </struct></value>
              <value><struct>
                <member><name>id</name><value><int>2</int></value></member>
                <member><name>name</name><value><string>Order #2</string></value></member>
              </struct></value>
            </data></array></value>
          </param>
        </params>
      </methodResponse>`;
    const parsed = parseResponse(xml) as Array<{ id: number; name: string }>;
    expect(parsed).toEqual([
      { id: 1, name: "Order #1" },
      { id: 2, name: "Order #2" },
    ]);
  });

  it("parses booleans correctly (1 = true, 0 = false)", () => {
    const xml = `<?xml version="1.0"?><methodResponse><params><param><value><boolean>1</boolean></value></param></params></methodResponse>`;
    expect(parseResponse(xml)).toBe(true);
  });

  it("throws on <fault>", () => {
    const xml = `<?xml version="1.0"?>
      <methodResponse>
        <fault>
          <value><struct>
            <member><name>faultCode</name><value><int>403</int></value></member>
            <member><name>faultString</name><value><string>Access denied</string></value></member>
          </struct></value>
        </fault>
      </methodResponse>`;
    expect(() => parseResponse(xml)).toThrow(/Access denied/);
  });

  it("handles many2one [id, name] arrays as Odoo returns them", () => {
    const xml = `<?xml version="1.0"?>
      <methodResponse><params><param>
        <value><array><data>
          <value><int>3</int></value>
          <value><string>WoodCutter Nord GmbH</string></value>
        </data></array></value>
      </param></params></methodResponse>`;
    expect(parseResponse(xml)).toEqual([3, "WoodCutter Nord GmbH"]);
  });
});
