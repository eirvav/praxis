"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { menuConfigs, MenuGroup, MenuItem } from "@/lib/menu-list";
import { useLocale } from 'next-intl';
import { useEffect } from 'react';

export function Menu({ role }: { role: string }) {
  const pathname = usePathname();
  const t = useTranslations('common');
  const locale = useLocale();

  useEffect(() => {
    console.log('Menu - Component mounted/updated');
    console.log('Menu - Current locale:', locale);
  }, [locale]);

  const config = menuConfigs[role];
  if (!config) return null;

  const isQuickCreate = (item: MenuItem) => item.translationKey === "common.navigation.quickCreate";

  return (
    <nav className="grid items-start gap-2">
      {config.groups.map((group: MenuGroup, groupIndex: number) => (
        <div key={groupIndex}>
          {group.label && (
            <h4 className="mb-1 px-2 text-sm font-semibold">{group.label}</h4>
          )}
          {group.items.map((item: MenuItem, itemIndex: number) => {
            if (item.translationKey) {
              console.log('Menu - Processing item with translation:', {
                translationKey: item.translationKey,
                locale,
                originalKey: item.translationKey,
                processedKey: item.translationKey.replace('common.', ''),
              });
            }
            
            const translationKey = item.translationKey?.replace('common.', '');
            const label = translationKey ? t(translationKey) : item.label;
            
            return (
              <Link
                key={itemIndex}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full justify-start",
                  isQuickCreate(item) && "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white",
                  pathname === item.href && !isQuickCreate(item) && "bg-muted"
                )}
              >
                {item.icon && (
                  <item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
} 