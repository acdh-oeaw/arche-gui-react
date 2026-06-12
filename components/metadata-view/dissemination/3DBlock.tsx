interface PLYBlockProps {
  url: string;
}

export function PLYBlock({ url: _url }: Readonly<PLYBlockProps>) {
  return (
    <div>{'PLYBlock'}</div>
  );
}
