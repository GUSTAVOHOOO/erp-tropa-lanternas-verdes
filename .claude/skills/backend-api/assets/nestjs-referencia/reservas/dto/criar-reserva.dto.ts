import { Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, Min, ValidateNested } from 'class-validator'

export class ItemReservaDto {
  @IsInt() recursoId: number
  @IsInt() @Min(1) qtd: number
}

export class CriarReservaDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50)
  @ValidateNested({ each: true }) @Type(() => ItemReservaDto)
  itens: ItemReservaDto[]
}
