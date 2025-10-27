// src/components/ui/date-range-picker.jsx

"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale" // Import para o formato de data em português
import { Calendar as CalendarIcon } from "lucide-react" 

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({
  className,
  onUpdate // Adicionamos uma prop para notificar a página pai
}) {
  // Define a data inicial como o início do mês atual e o fim como o dia de hoje
  const [date, setDate] = React.useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })

  // Efeito para chamar a função onUpdate quando a data mudar
  React.useEffect(() => {
    if (onUpdate) {
      onUpdate({ range: date });
    }
  }, [date, onUpdate]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                  {format(date.to, "LLL dd, y", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: ptBR })
              )
            ) : (
              <span>Escolha um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={ptBR} // Usa o locale em português no calendário
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
