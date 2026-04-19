interface RequestHandlerImportMetaLike {
  env?: {
    MODE?: string;
  };
}

export function getRequestHandlerMode(
  meta: RequestHandlerImportMetaLike
): string {
  return meta.env?.MODE ?? "production";
}
