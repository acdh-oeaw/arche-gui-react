
import React from 'react';

import { Link } from "@/components/link";

interface Props {
  title: string;
  items: Record<string, string>;
}

function DisplayField({ title, items }: Props) {

  return (
    <span>
      <strong>{title}: </strong>

      {items.flatMap((item, index) => {
        const element =
          item.type === 'REL' ? (
            <Link key={index} href={`/metadata/${item.id}`}>
              {item.value}
            </Link>
          ) : (
            <span key={index}>{item.value}</span>
          );

        // add commas between items
        return index === 0 ? [element] : [', ', element];
      })}
    </span>
  );
}

export default DisplayField;
