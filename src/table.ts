export function table(heading: string, data: Record<string, any>[]): string {
  let length: Record<string, number> = {};
  const keys = [
    ...new Set(
      data.reduce((res: string[], obj) => [...res, ...Object.keys(obj)], [])
    ),
  ];
  const empty: Record<string, string> = {};
  const header: Record<string, string> = {};
  keys.forEach((key) => (length[key] = key.length + 2));
  data.forEach((e: Record<string, any>) => {
    keys.forEach((key) => {
      empty[key] = "";
      header[key] = key;
      const len = ("  " + e[key]).length;
      length[key] = Math.max(length[key], len);
    });
  });

  function row(
    o: Record<string, any>,
    first: string,
    fill: string,
    separator: string,
    end: string
  ): string {
    return (
      "\n" +
      first +
      keys.reduce(
        (res, key, idx, arr) =>
          res +
          (fill + o[key]).padEnd(length[key], fill) +
          (idx !== arr.length - 1 ? separator : end),
        ""
      )
    );
  }
  let res = heading + ":" + row(empty, "┌", "─", "┬", "┐");
  res += row(header, "│", " ", "│", "│");
  for (let i = 0; i < data.length; ++i) {
    res += row(empty, "├", "─", "┼", "┤");
    res += row(data[i], "│", " ", "│", "│");
  }
  res += row(empty, "└", "─", "┴", "┘");
  return res;
}
